#!/usr/bin/env python3
"""
Paper Trading API
This script provides a simple API endpoint for the paper trading dashboard.
"""

import os
import sys
import json
import time
import logging
import subprocess
import signal
import psutil
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/paper_trading_api.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("paper_trading_api")

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Path to the paper trading CLI script
PAPER_TRADING_CLI = os.path.join(os.path.dirname(os.path.abspath(__file__)), "paper_trading_cli.py")

# Path to the paper trading state file
STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend/trading_data/paper_trading_state.json")

# Path to store the PID of the paper trading process
PID_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs/paper_trading.pid")

def run_command(command, args=None):
    """Run a command on the paper trading CLI."""
    # Special handling for start command to avoid blocking
    if command == 'start':
        return run_start_command(args)
    
    # Special handling for stop command
    if command == 'stop':
        # First kill any running process
        if not kill_running_process():
            return {"status": "error", "message": "Failed to stop paper trading process"}
    
    cmd = [sys.executable, PAPER_TRADING_CLI, command]
    if args:
        for key, value in args.items():
            if value is not None:  # Only add if not None
                cmd.append(f"--{key}")
                cmd.append(str(value))
    
    logger.info(f"Running command: {' '.join(cmd)}")
    try:
        # Use timeout to prevent hanging
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, timeout=30)  # Increased timeout
        logger.info(f"Command output: {result.stdout}")
        return {"status": "success", "output": result.stdout}
    except subprocess.TimeoutExpired as e:
        logger.error(f"Command timed out after 30 seconds: {command}")
        return {"status": "error", "message": f"Command timed out after 30 seconds: {command}"}
    except subprocess.CalledProcessError as e:
        error_msg = e.stderr or "Unknown error"
        logger.error(f"Command failed: {error_msg}")
        return {"status": "error", "message": error_msg}
    except Exception as e:
        logger.error(f"Error running command: {str(e)}")
        return {"status": "error", "message": str(e)}

def get_process_status():
    """Check if the paper trading process is running."""
    try:
        if os.path.exists(PID_FILE):
            with open(PID_FILE, 'r') as f:
                pid = int(f.read().strip())
            
            try:
                process = psutil.Process(pid)
                if process.is_running() and any('paper_trading_cli' in cmd for cmd in process.cmdline()):
                    return {"status": "running", "pid": pid}
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                # Process doesn't exist or can't be accessed
                pass
                
            # Process not running, clean up the pid file
            os.remove(PID_FILE)
    except Exception as e:
        logger.error(f"Error checking process status: {str(e)}")
    
    return {"status": "not_running", "pid": None}

def kill_running_process():
    """Kill any existing paper trading process."""
    process_status = get_process_status()
    if process_status["status"] == "running":
        try:
            pid = process_status["pid"]
            os.kill(pid, signal.SIGTERM)
            logger.info(f"Sent SIGTERM to process {pid}")
            
            # Wait for process to terminate
            for _ in range(5):  # Wait up to 5 seconds
                time.sleep(1)
                try:
                    # Check if process still exists
                    os.kill(pid, 0)
                except OSError:
                    # Process is gone
                    break
            else:
                # If process still exists after 5 seconds, force kill
                try:
                    os.kill(pid, signal.SIGKILL)
                    logger.info(f"Sent SIGKILL to process {pid}")
                except OSError:
                    pass  # Process already gone
            
            # Clean up PID file
            if os.path.exists(PID_FILE):
                os.remove(PID_FILE)
                
            return True
        except Exception as e:
            logger.error(f"Error killing process: {str(e)}")
            return False
    return True  # No process to kill

def run_start_command(args=None):
    """Run the start command in a non-blocking way."""
    # First, make sure no existing process is running
    kill_running_process()
    
    cmd = [sys.executable, PAPER_TRADING_CLI, "start"]
    if args:
        for key, value in args.items():
            if value is not None:  # Only add if not None
                cmd.append(f"--{key}")
                cmd.append(str(value))
    
    logger.info(f"Running start command in background: {' '.join(cmd)}")
    try:
        # Ensure logs directory exists
        os.makedirs("logs", exist_ok=True)
        
        # Run the start command in the background
        with open(os.path.join("logs", "paper_trading_start.log"), "a") as log_file:
            process = subprocess.Popen(
                cmd,
                stdout=log_file,
                stderr=log_file,
                start_new_session=True
            )
        
        # Save the PID to a file
        with open(PID_FILE, 'w') as f:
            f.write(str(process.pid))
            
        logger.info(f"Started paper trading in background with PID: {process.pid}")
        
        # Give it a moment to start up
        time.sleep(2)
        
        # Check if the process is still running
        if process.poll() is None:
            return {"status": "success", "message": "Paper trading started successfully in background", "pid": process.pid}
        else:
            # Check for any error in logs
            error_message = "Failed to start paper trading in background"
            try:
                with open(os.path.join("logs", "paper_trading_start.log"), "r") as log_file:
                    last_lines = log_file.readlines()[-10:]  # Get last 10 lines
                    if last_lines:
                        error_message += ": " + "\n".join(last_lines)
            except Exception:
                pass
            
            return {"status": "error", "message": error_message}
    except Exception as e:
        logger.error(f"Error starting paper trading: {str(e)}")
        return {"status": "error", "message": str(e)}

def get_status():
    """Get the current paper trading status."""
    try:
        # Get process status first
        process_status = get_process_status()
        is_running = process_status["status"] == "running"
        
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r') as f:
                data = json.load(f)
                
                # Update the running status based on actual process status
                if "is_running" in data:
                    data["is_running"] = is_running
                    
                # Add the process status info
                data["process_info"] = process_status
                
                return {"status": "success", "data": data}
        else:
            return {"status": "error", "message": "State file not found"}
    except Exception as e:
        logger.error(f"Error getting status: {str(e)}")
        return {"status": "error", "message": str(e)}

@app.route('/trading/paper', methods=['GET'])
def get_paper_trading_status():
    """GET endpoint to retrieve paper trading status."""
    return jsonify(get_status())

@app.route('/trading/paper', methods=['POST'])
def handle_paper_trading_command():
    """POST endpoint to handle paper trading commands."""
    try:
        data = request.json
        logger.info(f"Received command request: {data}")
        
        if not data or 'command' not in data:
            logger.error("Missing command parameter")
            return jsonify({"status": "error", "message": "Missing command parameter"}), 400
        
        command = data.pop('command')
        logger.info(f"Processing command: {command} with params: {data}")
        
        # Handle special commands
        if command == 'api':
            if 'key' not in data or 'secret' not in data:
                logger.error("Missing API key or secret")
                return jsonify({"status": "error", "message": "Missing API key or secret"}), 400
            return jsonify(run_command(command, {'key': data['key'], 'secret': data['secret']}))
        
        # Handle auto-execute command
        if command == 'auto-execute':
            if 'enabled' not in data:
                return jsonify({"status": "error", "message": "Missing enabled parameter"}), 400
                
            args = {}
            args['enabled'] = str(data.get('enabled')).lower()
            
            if 'confidence' in data:
                confidence = float(data.get('confidence', 0.75))
                if confidence < 0 or confidence > 1:
                    return jsonify({"status": "error", "message": "Confidence must be between 0 and 1"}), 400
                args['confidence'] = str(confidence)
                
            if 'interval' in data:
                interval = int(data.get('interval', 60))
                if interval <= 0:
                    return jsonify({"status": "error", "message": "Interval must be positive"}), 400
                args['interval'] = str(interval)
                
            return jsonify(run_command(command, args))
        
        # Handle standard commands
        valid_commands = ['start', 'stop', 'status', 'switch', 'reset', 'export']
        if command not in valid_commands:
            return jsonify({"status": "error", "message": f"Invalid command: {command}"}), 400
        
        # For the switch command, we need a mode parameter
        if command == 'switch' and 'mode' not in data:
            return jsonify({"status": "error", "message": "Missing mode parameter for switch command"}), 400
        
        # Run the command
        result = run_command(command, data)
        return jsonify(result)
    
    except Exception as e:
        logger.error(f"Error handling command: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    # Make sure logs directory exists
    os.makedirs("logs", exist_ok=True)
    
    # Check if paper trading CLI exists
    if not os.path.exists(PAPER_TRADING_CLI):
        logger.error(f"Paper trading CLI script not found at {PAPER_TRADING_CLI}")
        sys.exit(1)
    
    # Check for any orphaned processes and clean them up on startup
    process_status = get_process_status()
    if process_status["status"] == "running":
        logger.info(f"Found existing paper trading process with PID {process_status['pid']}, checking if it's valid...")
        kill_running_process()  # Clean up any existing processes
    
    logger.info(f"Starting paper trading API server on port 5001")
    logger.info(f"Paper trading CLI path: {PAPER_TRADING_CLI}")
    
    # Run with threaded=True to handle multiple requests
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
