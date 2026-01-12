
'use client';

import useSWR from 'swr';
import { Clock, Users, Utensils, AlertTriangle, CheckCircle, Flame, Bell } from 'lucide-react';
import styles from './page.module.css';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function KitchenPage() {
    // Poll every 5 seconds
    const { data: reservations, mutate } = useSWR('/api/reservations', fetcher, { refreshInterval: 5000 });

    const updateStatus = async (id: number, status: string) => {
        await fetch(`/api/reservations/${id}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        mutate(); // Refresh local data
    };

    const getNextStatus = (current: string) => {
        switch (current) {
            case 'PENDING': return 'CONFIRMED';
            case 'CONFIRMED': return 'COOKING';
            case 'COOKING': return 'SERVED';
            case 'SERVED': return 'COMPLETED';
            default: return null;
        }
    };

    const getActionLabel = (current: string) => {
        switch (current) {
            case 'PENDING': return 'Confirm';
            case 'CONFIRMED': return 'Start Cooking';
            case 'COOKING': return 'Serve';
            case 'SERVED': return 'Finish';
            default: return null;
        }
    };

    const getIcon = (status: string) => {
        switch (status) {
            case 'COOKING': return <Flame size={16} />;
            case 'SERVED': return <Utensils size={16} />;
            default: return <CheckCircle size={16} />;
        }
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Kitchen Dashboard</h1>
                <div className="btn btn-secondary">
                    <Clock size={16} style={{ marginRight: '0.5rem' }} />
                    {new Date().toLocaleTimeString()}
                </div>
            </header>

            <div className={styles.grid}>
                {reservations?.length === 0 && <p style={{ color: 'var(--secondary)', fontSize: '1.5rem' }}>No active reservations.</p>}

                {reservations?.map((r: any) => (
                    <div key={r.id} className={styles.card} style={{ borderColor: r.status === 'COOKING' ? 'var(--primary)' : 'var(--border)' }}>
                        <div className={styles.cardHeader}>
                            <div className={styles.time}>{new Date(r.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                            <span className={`${styles.statusBadge} ${styles['status' + r.status]}`}>
                                {r.status}
                            </span>
                        </div>

                        <div className={styles.guestInfo}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <div className={styles.tableInfo}>
                                    Table {r.table?.number || '?'} ({r.partySize}p)
                                </div>
                                {/* Guest History/Type */}
                                <span className="badge badge-warning">Guest: {r.guestName}</span>
                            </div>

                            <div className={styles.orderDetails}>
                                <div style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                                    <Utensils size={16} style={{ marginRight: '0.5rem' }} /> Order:
                                </div>
                                {r.orderDetails || 'No pre-order'}
                            </div>

                            {/* CRM / Allergy Info */}
                            {r.guest?.allergies && (
                                <div className={styles.alert}>
                                    <AlertTriangle size={18} /> Allergy: {r.guest.allergies}
                                </div>
                            )}

                            {r.specialRequests && (
                                <div className={styles.requests}>
                                    "{r.specialRequests}"
                                </div>
                            )}
                        </div>

                        <div className={styles.actions}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => updateStatus(r.id, 'CANCELLED')}
                                style={{ marginRight: 'auto', color: 'var(--error)' }}
                            >
                                Cancel
                            </button>

                            {getNextStatus(r.status) && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => updateStatus(r.id, getNextStatus(r.status)!)}
                                >
                                    {getIcon(getNextStatus(r.status)!)}
                                    <span style={{ marginLeft: '0.5rem' }}>{getActionLabel(r.status)}</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
