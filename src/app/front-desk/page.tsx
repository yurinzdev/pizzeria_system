
'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Search, User, Clock, CheckCircle, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import styles from './page.module.css';

// Types
type Guest = {
    id: string;
    name: string;
    roomNumber: string;
    allergies?: string;
    notes?: string;
    visitCount: number;
};

type Table = {
    id: string;
    number: number;
    capacity: number;
    status: 'AVAILABLE' | 'RESERVED' | 'OCCUPIED';
};

type MenuItem = {
    id: string;
    name: string;
    price: number;
    allergens?: string;
};

// Fetcher
const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function FrontDeskPage() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [roomInput, setRoomInput] = useState('');
    const [guest, setGuest] = useState<Guest | null>(null);
    const [time, setTime] = useState('18:00');
    const [partySize, setPartySize] = useState(2);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [selectedMenu, setSelectedMenu] = useState<MenuItem[]>([]);
    const [requests, setRequests] = useState('');

    // Data Fetching
    const { data: tables } = useSWR<Table[]>(
        step === 2 ? `/api/tables/availability?time=${new Date().toISOString().split('T')[0]}T${time}:00.000Z` : null,
        fetcher
    );

    const { data: menuItems } = useSWR<MenuItem[]>(
        step === 3 ? `/api/menu/search` : null,
        fetcher
    );

    // Handlers
    const handleGuestLookup = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/crm/search?room=${roomInput}`);
            if (res.ok) {
                const data = await res.json();
                setGuest(data);
            } else {
                alert('Guest not found');
                setGuest(null);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guestId: guest?.id,
                    guestName: guest?.name || 'Walk-in',
                    roomNumber: guest?.roomNumber,
                    tableId: selectedTable?.id,
                    time: new Date().toISOString().split('T')[0] + 'T' + time + ':00.000Z', // Today + Time
                    partySize,
                    adults: partySize, // Simplify for now
                    children: 0,
                    orderDetails: selectedMenu.map(m => m.name).join(', '),
                    specialRequests: requests
                })
            });
            if (res.ok) {
                alert('Reservation Confirmed!');
                // Reset or redirect
                window.location.reload();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const hasAllergyConflict = (item: MenuItem) => {
        if (!guest?.allergies || !item.allergens) return false;
        const guestAllergies = guest.allergies.split(',').map(a => a.trim().toUpperCase());
        const itemAllergens = item.allergens.split(',').map(a => a.trim().toUpperCase());
        return itemAllergens.some(a => guestAllergies.includes(a));
    };

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>Pizza Reservation</h1>
                <p className={styles.subtitle}>Front Desk Booking System</p>
            </header>

            {/* Steps Indicator */}
            <div className={styles.stepIndicator}>
                {[1, 2, 3, 4, 5].map(s => (
                    <div key={s} className={`${styles.step} ${step === s ? styles.stepActive : ''} ${step > s ? styles.stepCompleted : ''}`}>
                        {step > s ? <CheckCircle size={20} /> : s}
                    </div>
                ))}
            </div>

            <div className={styles.card}>
                {/* Step 1: Guest Lookup */}
                {step === 1 && (
                    <div>
                        <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Guest Lookup</h2>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Room Number</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    className={styles.input}
                                    value={roomInput}
                                    onChange={e => setRoomInput(e.target.value)}
                                    placeholder="e.g. 305"
                                    autoFocus
                                />
                                <button className="btn btn-primary" onClick={handleGuestLookup} disabled={loading}>
                                    {loading ? 'Searching...' : <Search size={18} />}
                                </button>
                            </div>
                        </div>

                        {guest && (
                            <div className={styles.guestCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <h3>{guest.name} <span className="badge badge-success">Guest</span></h3>
                                    <span>Visits: {guest.visitCount}</span>
                                </div>
                                {guest.allergies && (
                                    <div className={styles.allergyAlert}>
                                        <AlertTriangle size={16} /> Allergy: {guest.allergies}
                                    </div>
                                )}
                                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--secondary)' }}>
                                    {guest.notes}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Step 2: Time & Table */}
                {step === 2 && (
                    <div>
                        <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Select Table</h2>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>Time</label>
                                <select className={styles.input} value={time} onChange={e => setTime(e.target.value)}>
                                    <option value="18:00">18:00</option>
                                    <option value="18:30">18:30</option>
                                    <option value="19:00">19:00</option>
                                    <option value="19:30">19:30</option>
                                    <option value="20:00">20:00</option>
                                </select>
                            </div>
                            <div className={styles.formGroup} style={{ flex: 1 }}>
                                <label className={styles.label}>Party Size</label>
                                <input type="number" className={styles.input} value={partySize} onChange={e => setPartySize(Number(e.target.value))} min={1} />
                            </div>
                        </div>
                        <div className={styles.grid}>
                            {tables?.map(table => (
                                <div
                                    key={table.id}
                                    className={`${styles.tableCard} ${selectedTable?.id === table.id ? styles.tableCardSelected : ''} ${table.status !== 'AVAILABLE' ? styles.tableCardDisabled : ''}`}
                                    onClick={() => table.status === 'AVAILABLE' && setSelectedTable(table)}
                                >
                                    <strong>Table {table.number}</strong>
                                    <div>{table.capacity} Seats</div>
                                    <div className="badge" style={{ marginTop: '0.5rem', background: table.status === 'AVAILABLE' ? 'var(--success)' : 'var(--border)' }}>
                                        {table.status}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Menu */}
                {step === 3 && (
                    <div>
                        <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Pre-order Menu</h2>
                        <div>
                            {menuItems?.map(item => {
                                const isAllergen = hasAllergyConflict(item);
                                const isSelected = selectedMenu.find(m => m.id === item.id);
                                return (
                                    <div key={item.id} className={styles.menuItem} style={{ background: isSelected ? 'var(--surface)' : 'transparent' }}>
                                        <div>
                                            <strong>{item.name}</strong>
                                            <div>¥{item.price}</div>
                                            {isAllergen && (
                                                <div className={styles.allergyAlert}>
                                                    <AlertTriangle size={14} /> Warning: Contains {guest?.allergies}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            className={`btn ${isSelected ? 'btn-secondary' : 'btn-primary'}`}
                                            onClick={() => {
                                                if (isSelected) setSelectedMenu(selectedMenu.filter(m => m.id !== item.id));
                                                else setSelectedMenu([...selectedMenu, item]);
                                            }}
                                        >
                                            {isSelected ? 'Remove' : 'Add'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Step 4: Requests */}
                {step === 4 && (
                    <div>
                        <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Special Requests</h2>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>Notes</label>
                            <textarea
                                className={styles.input}
                                rows={4}
                                placeholder="Window seat, Birthday, etc."
                                value={requests}
                                onChange={e => setRequests(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Step 5: Confirm */}
                {step === 5 && (
                    <div>
                        <h2 className={styles.title} style={{ fontSize: '1.5rem' }}>Confirm Reservation</h2>
                        <div className={styles.guestCard} style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                            <p><strong>Guest:</strong> {guest?.name} (Rm {guest?.roomNumber})</p>
                            <p><strong>Time:</strong> {time}, {partySize} People</p>
                            <p><strong>Table:</strong> #{selectedTable?.number} ({selectedTable?.capacity} pax)</p>
                            <p><strong>Order:</strong> {selectedMenu.map(m => m.name).join(', ') || 'No pre-order'}</p>
                            <p><strong>Requests:</strong> {requests || 'None'}</p>
                        </div>
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className={styles.btnGroup}>
                    {step > 1 && (
                        <button className="btn btn-secondary" onClick={() => setStep(step - 1)}>
                            <ChevronLeft size={16} style={{ marginRight: '0.5rem' }} /> Back
                        </button>
                    )}
                    {step < 5 ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => setStep(step + 1)}
                            disabled={
                                (step === 1 && !guest) ||
                                (step === 2 && !selectedTable)
                            }
                        >
                            Next <ChevronRight size={16} style={{ marginLeft: '0.5rem' }} />
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Submitting...' : 'Confirm Reservation'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
