import React, { useMemo } from 'react';
import type { Product } from '../../types';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface AnalyticsProps {
    products: Product[];
}

const Analytics: React.FC<AnalyticsProps> = ({ products }) => {
    
    const soldProducts = useMemo(() => products.filter(p => p.quantity_sold > 0), [products]);

    const topProductsData = useMemo(() => {
        const productsWithRevenue = soldProducts.map(p => ({
            title: p.title,
            revenue: p.price * p.quantity_sold
        }));

        const sortedProducts = productsWithRevenue.sort((a, b) => b.revenue - a.revenue);
        const top5 = sortedProducts.slice(0, 5);

        return {
            labels: top5.map(p => p.title),
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
                position: 'top' as const,
                labels: {
                    color: '#3D081B',
                    font: {
                        family: 'Poppins, sans-serif'
                    }
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
                    }
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
             <div className="mt-10 text-center py-16 px-6 bg-brand-cream rounded-xl border-2 border-dashed border-brand-dark/10">
                <h2 className="text-2xl font-bold text-brand-dark">Your Analytics Hub</h2>
                <p className="text-brand-dark/70 mt-2">Sales data will appear here once you make your first sale!</p>
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
