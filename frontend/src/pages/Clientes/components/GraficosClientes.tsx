import { BarChart3, LayoutGrid, PieChart as PieChartIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { getChartData, getIncomeData } from '../utils/helpers';
import type { Client } from '@/lib/database.types';

interface GraficosClientesProps {
    filteredClients: Client[];
}

export const GraficosClientes = ({ filteredClients }: GraficosClientesProps) => {
    return (
        <div key="charts-view" className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Renda */}
            <div className="gtp-card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Distribuição por Renda
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getIncomeData(filteredClients)} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Cidade */}
            <div className="gtp-card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-blue-500" />
                    Top Cidades
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData('cidade', filteredClients)} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bairro */}
            <div className="gtp-card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <LayoutGrid className="w-5 h-5 text-purple-500" />
                    Top Bairros
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getChartData('bairro', filteredClients)} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={120} fontSize={10} />
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tipo Imóvel */}
            <div className="gtp-card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5 text-emerald-500" />
                    Tipo de Imóvel
                </h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={getChartData('tipo_imovel', filteredClients)}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#10b981"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                            >
                                {getChartData('tipo_imovel', filteredClients).map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={[
                                        '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'
                                    ][index % 6]} />
                                ))}
                            </Pie>
                            <RechartsTooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
