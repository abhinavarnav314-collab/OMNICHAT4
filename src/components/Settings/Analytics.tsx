import React, { useMemo } from 'react';
import { useChatStore } from '../../store/useChatStore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const { conversations } = useChatStore();

  const { modelUsage, costTimeline, totalCost, totalTokens } = useMemo(() => {
    const modelUsage: Record<string, number> = {};
    const costTimeline: Record<string, number> = {};
    let totalCost = 0;
    let totalTokens = 0;

    conversations.forEach(convo => {
      convo.messages.forEach(msg => {
        if (msg.role === 'assistant' && msg.modelId) {
          modelUsage[msg.modelId] = (modelUsage[msg.modelId] || 0) + 1;
          
          if (msg.cost) {
             const date = new Date(msg.timestamp).toLocaleDateString();
             costTimeline[date] = (costTimeline[date] || 0) + msg.cost;
             totalCost += msg.cost;
          }
          if (msg.tokens) {
              totalTokens += msg.tokens.prompt + msg.tokens.completion;
          }
        }
      });
    });

    return { modelUsage, costTimeline, totalCost, totalTokens };
  }, [conversations]);

  const barData = {
    labels: Object.keys(costTimeline),
    datasets: [
      {
        label: 'Cost ($)',
        data: Object.values(costTimeline),
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
      },
    ],
  };

  const pieData = {
    labels: Object.keys(modelUsage),
    datasets: [
      {
        label: 'Usage Count',
        data: Object.values(modelUsage),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
          'rgba(255, 159, 64, 0.5)',
        ],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
              <div className="text-sm text-slate-500">Total API Cost</div>
              <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border dark:border-slate-700">
              <div className="text-sm text-slate-500">Total Tokens</div>
              <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
          </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold mb-4 text-center">Cost Timeline</h3>
            <div className="h-48">
              <Bar data={barData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-bold mb-4 text-center">Model Usage</h3>
            <div className="h-48">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>
      </div>
    </div>
  );
}
