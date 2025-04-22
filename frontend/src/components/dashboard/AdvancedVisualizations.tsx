import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { useSpring, animated } from 'react-spring';
import { Chart as ChartJS, ArcElement } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import ForceGraph3D from '3d-force-graph';
import * as d3 from 'd3';

// Register Chart.js components
ChartJS.register(ArcElement);

const AnimatedPaper = styled(motion(Paper))(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  },
}));

const AdvancedVisualizations: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [portfolioData, setPortfolioData] = useState({
    labels: ['Crypto', 'Stocks', 'ETFs', 'Options'],
    datasets: [
      {
        data: [30, 15, 25, 30],
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#f97316'],
        hoverOffset: 4,
      },
    ],
  });

  const [correlationData, setCorrelationData] = useState({
    nodes: [
      { id: 'BTC', group: 1 },
      { id: 'ETH', group: 2 },
      { id: 'SOL', group: 3 },
      { id: 'DOT', group: 1 },
      { id: 'ADA', group: 2 },
      { id: 'LTC', group: 3 },
    ],
    links: [
      { source: 'BTC', target: 'ETH', value: 0.8 },
      { source: 'BTC', target: 'SOL', value: 0.6 },
      { source: 'ETH', target: 'DOT', value: 0.7 },
      { source: 'DOT', target: 'ADA', value: 0.5 },
      { source: 'SOL', target: 'LTC', value: 0.4 },
    ],
  });

  const [heatmapData, setHeatmapData] = useState({
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    hours: Array.from({ length: 24 }, (_, i) => i.toString()),
    data: Array.from({ length: 24 }, () =>
      Array.from({ length: 7 }, () => Math.random() * 100)
    ),
  });

  return (
    <Grid container spacing={3}>
      {/* Portfolio Allocation */}
      <Grid item xs={12} md={6}>
        <AnimatedPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Portfolio Allocation
          </Typography>
          <Box sx={{ height: 300 }}>
            <Doughnut data={portfolioData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom' as const,
                },
              },
            }} />
          </Box>
        </AnimatedPaper>
      </Grid>

      {/* Asset Correlation Network */}
      <Grid item xs={12} md={6}>
        <AnimatedPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Asset Correlation Network
          </Typography>
          <Box sx={{ height: 300 }}>
            <ForceGraph3D
              graphData={correlationData}
              nodeAutoColorBy="group"
              nodeLabel="id"
              linkWidth={(l) => l.value * 5}
              onNodeClick={(node) => {
                console.log('Node clicked:', node);
              }}
              backgroundColor="#0f172a"
            />
          </Box>
        </AnimatedPaper>
      </Grid>

      {/* Trading Volume Heatmap */}
      <Grid item xs={12}>
        <AnimatedPaper
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Typography variant="h5" component="h3" gutterBottom>
            Trading Volume Heatmap
          </Typography>
          <Box sx={{ height: 400 }}>
            <svg width="100%" height="400">
              {heatmapData.hours.map((hour, i) => (
                <g key={hour}>
                  {heatmapData.days.map((day, j) => (
                    <rect
                      key={`${hour}-${day}`}
                      x={j * 50}
                      y={i * 20}
                      width={48}
                      height={18}
                      fill={d3.interpolateViridis(heatmapData.data[i][j] / 100)}
                      rx={4}
                      ry={4}
                      onClick={() => {
                        console.log(`Clicked: ${day} ${hour}:00`);
                      }}
                    />
                  ))}
                </g>
              ))}
              
              {/* Add day labels */}
              {heatmapData.days.map((day, j) => (
                <text
                  key={day}
                  x={j * 50 + 24}
                  y={20}
                  fill="#fff"
                  textAnchor="middle"
                  fontSize="12"
                >
                  {day}
                </text>
              ))}
              
              {/* Add hour labels */}
              {heatmapData.hours.map((hour, i) => (
                <text
                  key={hour}
                  x={0}
                  y={i * 20 + 15}
                  fill="#fff"
                  fontSize="10"
                  textAnchor="end"
                >
                  {hour}:00
                </text>
              ))}
            </svg>
          </Box>
        </AnimatedPaper>
      </Grid>
    </Grid>
  );
};

export default AdvancedVisualizations;
