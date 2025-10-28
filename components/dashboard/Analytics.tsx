import React, { useMemo } from 'react';
import type { Product } from '../../types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface AnalyticsProps {
    products: Product[];
    onNavigate: (view: 'best_practices') => void;
}

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-dark mb-4"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
);

const Analytics: React.FC<AnalyticsProps> = ({ products, onNavigate }) => {
    
    const soldProducts = useMemo(() => products.filter(p => p.quantity_sold > 0), [products]);

    const topProductsData = useMemo(() => {
        const productsWithRevenue = soldProducts.map(p => ({
            title: p.title,
            revenue: p.price * p.quantity_sold
        }));

        const sortedProducts = productsWithRevenue.sort((a, b) => b.revenue - a.revenue);
        const top5 = sortedProducts.slice(0, 5);

        return {
            labels: top5.map(p => p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title),
            datasets: [{
                label: 'Total Revenue (₹)',
                data: top5.map(p => p.revenue),
                backgroundColor: '#910F3F',
                borderColor: '#3D081B',
                borderWidth: 1,
                borderRadius: 4,
            }]
        };
    }, [soldProducts]);

    const categoryRevenueData = useMemo(() => {
        const revenueByCategory: { [key: string]: number } = {};

        soldProducts.forEach(p => {
            const revenue = p.price * p.quantity_sold;
            const categories = p.category && p.category.length > 0 ? p.category : ['Uncategorized'];
            categories.forEach(cat => {
                revenueByCategory[cat] = (revenueByCategory[cat] || 0) + revenue;
            });
        });

        const sortedCategories = Object.entries(revenueByCategory).sort(([, a], [, b]) => b - a);

        return {
            labels: sortedCategories.map(([name]) => name),
            datasets: [{
                label: 'Revenue (₹)',
                data: sortedCategories.map(([, revenue]) => revenue),
                backgroundColor: [
                    '#910F3F',
                    '#3D081B',
                    '#C75D7B',
                    '#6A0B2B',
                    '#E0A7B7',
                    '#B34E6D'
                ],
                borderColor: '#F2EFDD',
                borderWidth: 2,
            }]
        };
    }, [soldProducts]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#3D081B',
                titleFont: { family: 'Poppins, sans-serif' },
                bodyFont: { family: 'Poppins, sans-serif' },
            }
        },
        scales: {
             x: {
                ticks: {
                    color: '#3D081B',
                    font: {
                        family: 'Poppins, sans-serif'
                    }
                },
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    color: '#3D081B',
                    font: {
                        family: 'Poppins, sans-serif'
                    }
                },
                 grid: {
                    color: '#3D081B1A'
                }
            }
        }
    };
    
    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'right' as const,
                 labels: {
                    color: '#3D081B',
                    font: {
                        family: 'Poppins, sans-serif'
                    },
                    boxWidth: 20,
                    padding: 15,
                }
            },
            title: {
                display: false,
            },
            tooltip: {
                backgroundColor: '#3D081B',
                titleFont: { family: 'Poppins, sans-serif' },
                bodyFont: { family: 'Poppins, sans-serif' },
            }
        }
    };

    if (soldProducts.length === 0) {
        return (
            <div className="mt-12">
                <h2 className="text-3xl font-bold text-brand-dark mb-6">Lifetime Sales Analytics</h2>
                <div className="relative">
                    {/* Blurred background content */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 filter blur-md opacity-60 pointer-events-none">
                        <div className="lg:col-span-3 bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/10">
                            <h3 className="text-xl font-bold text-brand-dark mb-4">Top 5 Products by Revenue</h3>
                            <div className="relative h-96 bg-brand-light rounded-md"></div>
                        </div>
                        <div className="lg:col-span-2 bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/10">
                            <h3 className="text-xl font-bold text-brand-dark mb-4">Revenue by Category</h3>
                            <div className="relative h-96 w-48 h-48 mx-auto mt-12 bg-brand-light rounded-full"></div>
                        </div>
                    </div>

                    {/* Overlay with message */}
                    <div className="absolute inset-0 bg-brand-light/60 backdrop-blur-sm flex flex-col items-center justify-center text-center rounded-xl p-4">
                        <LockIcon />
                        <h3 className="text-2xl font-bold text-brand-dark">Unlock Your Sales Analytics</h3>
                        <p className="text-brand-dark/70 mt-2 max-w-sm">Make your FIRST SALE to activate this section and gain powerful insights into your business performance.</p>
                        <button onClick={() => onNavigate('best_practices')} className="mt-4 text-md font-bold text-brand-accent hover:underline">
                            Read the BEST PRACTICES to lock first sale &rarr;
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="mt-12">
            <h2 className="text-3xl font-bold text-brand-dark mb-6">Lifetime Sales Analytics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                <div className="lg:col-span-3 bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/10">
                    <h3 className="text-xl font-bold text-brand-dark mb-4">Top 5 Products by Revenue</h3>
                    <div className="relative h-96">
                        <Bar options={chartOptions} data={topProductsData} />
                    </div>
                </div>

                <div className="lg:col-span-2 bg-brand-cream p-6 rounded-xl shadow-md border border-brand-dark/10">
                    <h3 className="text-xl font-bold text-brand-dark mb-4">Revenue by Category</h3>
                     <div className="relative h-96">
                        <Doughnut data={categoryRevenueData} options={doughnutOptions} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Analytics;