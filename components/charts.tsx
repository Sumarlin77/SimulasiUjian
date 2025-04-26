"use client"

import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend)

export function BarChart() {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  }

  const labels = ["Mathematics Test", "Science Quiz", "History Assessment", "English Literature", "Programming Basics"]

  const data = {
    labels,
    datasets: [
      {
        label: "Participants",
        data: [45, 38, 29, 32, 41],
        backgroundColor: "rgba(53, 114, 239, 0.5)", // Updated to primary color
      },
    ],
  }

  return <Bar options={options} data={data} />
}

export function LineChart() {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
      },
    },
  }

  const labels = ["January", "February", "March", "April", "May", "June"]

  const data = {
    labels,
    datasets: [
      {
        label: "Average Score",
        data: [65, 68, 72, 75, 76, 78],
        borderColor: "rgb(53, 114, 239)", // Updated to primary color
        backgroundColor: "rgba(53, 114, 239, 0.5)", // Updated to primary color
      },
    ],
  }

  return <Line options={options} data={data} />
}
