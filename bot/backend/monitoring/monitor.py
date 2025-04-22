"""
Monitoring system for trading bot
Handles metrics collection, health checks, and alerts
"""

import logging
import threading
import time
from datetime import datetime, timedelta
import json
from typing import Dict, List, Optional
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

logger = logging.getLogger("monitor")

class Monitor:
    def __init__(self, config: Dict):
        """Initialize Monitor with configuration"""
        self.config = config
        self.metrics = {
            'health': {},
            'performance': {},
            'errors': {},
            'alerts': {}
        }
        self.alerts_sent = set()  # Track sent alerts to avoid duplicates
        self.monitoring_thread = None
        self.running = False
        
        # Initialize alert handlers
        self.alert_handlers = {
            'email': self._send_email_alert,
            'slack': self._send_slack_alert,
            'telegram': self._send_telegram_alert
        }
        
    def start(self) -> None:
        """Start monitoring system"""
        if self.running:
            return
            
        self.running = True
        self.monitoring_thread = threading.Thread(target=self._monitor_loop)
        self.monitoring_thread.daemon = True
        self.monitoring_thread.start()
        logger.info("Monitoring system started")
        
    def stop(self) -> None:
        """Stop monitoring system"""
        self.running = False
        if self.monitoring_thread:
            self.monitoring_thread.join()
        logger.info("Monitoring system stopped")
        
    def _monitor_loop(self) -> None:
        """Main monitoring loop"""
        while self.running:
            try:
                # Check health metrics
                self._check_health()
                
                # Check performance metrics
                self._check_performance()
                
                # Check for errors
                self._check_errors()
                
                # Send alerts if needed
                self._send_alerts()
                
                # Log metrics
                self._log_metrics()
                
                # Sleep before next check
                time.sleep(self.config.get('check_interval', 60))
                
            except Exception as e:
                logger.error(f"Error in monitoring loop: {str(e)}")
                time.sleep(60)  # Wait before retrying
                
    def _check_health(self) -> None:
        """Check system health metrics"""
        try:
            # Check API connectivity
            api_health = self._check_api_health()
            self.metrics['health']['api'] = api_health
            
            # Check memory usage
            memory_usage = self._check_memory_usage()
            self.metrics['health']['memory'] = memory_usage
            
            # Check disk space
            disk_space = self._check_disk_space()
            self.metrics['health']['disk'] = disk_space
            
            # Check CPU usage
            cpu_usage = self._check_cpu_usage()
            self.metrics['health']['cpu'] = cpu_usage
            
        except Exception as e:
            logger.error(f"Error checking health metrics: {str(e)}")
            
    def _check_performance(self) -> None:
        """Check performance metrics"""
        try:
            # Check trade execution latency
            latency = self._check_latency()
            self.metrics['performance']['latency'] = latency
            
            # Check trade success rate
            success_rate = self._check_trade_success_rate()
            self.metrics['performance']['success_rate'] = success_rate
            
            # Check API response times
            api_response_times = self._check_api_response_times()
            self.metrics['performance']['api_response_times'] = api_response_times
            
        except Exception as e:
            logger.error(f"Error checking performance metrics: {str(e)}")
            
    def _check_errors(self) -> None:
        """Check for errors in the system"""
        try:
            # Check API errors
            api_errors = self._check_api_errors()
            self.metrics['errors']['api'] = api_errors
            
            # Check trade execution errors
            trade_errors = self._check_trade_errors()
            self.metrics['errors']['trade'] = trade_errors
            
            # Check system errors
            system_errors = self._check_system_errors()
            self.metrics['errors']['system'] = system_errors
            
        except Exception as e:
            logger.error(f"Error checking errors: {str(e)}")
            
    def _send_alerts(self) -> None:
        """Send alerts for critical issues"""
        try:
            # Check health alerts
            if self._check_health_alerts():
                self._send_alert('health', 'System health critical')
                
            # Check performance alerts
            if self._check_performance_alerts():
                self._send_alert('performance', 'Performance degradation detected')
                
            # Check error alerts
            if self._check_error_alerts():
                self._send_alert('errors', 'Critical errors detected')
                
        except Exception as e:
            logger.error(f"Error sending alerts: {str(e)}")
            
    def _send_alert(self, alert_type: str, message: str) -> None:
        """Send an alert using configured methods"""
        try:
            # Create alert key to prevent duplicates
            alert_key = f"{alert_type}_{message}_{datetime.now().strftime('%Y%m%d')}
            
            # Skip if already sent today
            if alert_key in self.alerts_sent:
                return
                
            # Send alert using all configured methods
            for method in self.config.get('alert_methods', []):
                if method in self.alert_handlers:
                    self.alert_handlers[method](alert_type, message)
                    
            # Mark as sent
            self.alerts_sent.add(alert_key)
            
        except Exception as e:
            logger.error(f"Error sending alert: {str(e)}")
            
    def _send_email_alert(self, alert_type: str, message: str) -> None:
        """Send email alert"""
        try:
            if not self.config.get('email_enabled', False):
                return
                
            # Create email
            msg = MIMEMultipart()
            msg['From'] = self.config.get('email_from', 'tradingbot@localhost')
            msg['To'] = self.config.get('email_to', 'admin@localhost')
            msg['Subject'] = f"[TRADING BOT] {alert_type.upper()} ALERT"
            
            # Add message
            body = f"""
            Trading Bot Alert - {alert_type.upper()}
            
            Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            Message: {message}
            
            Current Metrics:
            {json.dumps(self.metrics, indent=2)}
            """
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            with smtplib.SMTP(self.config.get('smtp_server', 'localhost')) as server:
                server.send_message(msg)
                
        except Exception as e:
            logger.error(f"Error sending email alert: {str(e)}")
            
    def _send_slack_alert(self, alert_type: str, message: str) -> None:
        """Send Slack alert"""
        try:
            if not self.config.get('slack_enabled', False):
                return
                
            webhook_url = self.config.get('slack_webhook_url')
            if not webhook_url:
                return
                
            # Create message
            data = {
                'text': f"*TRADING BOT ALERT - {alert_type.upper()}*\n\n{message}",
                'attachments': [
                    {
                        'color': 'danger',
                        'fields': [
                            {
                                'title': 'Current Metrics',
                                'value': json.dumps(self.metrics, indent=2),
                                'short': False
                            }
                        ]
                    }
                ]
            }
            
            # Send to Slack
            response = requests.post(
                webhook_url,
                json=data,
                headers={'Content-Type': 'application/json'}
            )
            response.raise_for_status()
            
        except Exception as e:
            logger.error(f"Error sending Slack alert: {str(e)}")
            
    def _send_telegram_alert(self, alert_type: str, message: str) -> None:
        """Send Telegram alert"""
        try:
            if not self.config.get('telegram_enabled', False):
                return
                
            token = self.config.get('telegram_bot_token')
            chat_id = self.config.get('telegram_chat_id')
            if not token or not chat_id:
                return
                
            # Create message
            message = f"*TRADING BOT ALERT - {alert_type.upper()}*\n\n{message}"
            
            # Send to Telegram
            url = f"https://api.telegram.org/bot{token}/sendMessage"
            data = {
                'chat_id': chat_id,
                'text': message,
                'parse_mode': 'Markdown'
            }
            
            response = requests.post(url, json=data)
            response.raise_for_status()
            
        except Exception as e:
            logger.error(f"Error sending Telegram alert: {str(e)}")
