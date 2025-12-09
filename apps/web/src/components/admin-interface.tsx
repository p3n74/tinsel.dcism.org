'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModeToggle } from './mode-toggle';

interface DaySetting {
    day_number: number;
    food_of_the_day: string;
}

interface ConfigSettings {
    current_day: string;
}

export default function AdminInterface() {
    const { session } = useSession();
    const [days, setDays] = useState<DaySetting[]>([]);
    const [config, setConfig] = useState<ConfigSettings>({ current_day: '1' });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchSettings() {
            console.log("[AdminInterface] Fetching settings...");
            setIsLoading(true);
            try {
                const response = await fetch('/api/admin/settings');
                console.log("[AdminInterface] Settings fetch response status:", response.status, response.statusText);
                
                const contentType = response.headers.get('content-type');
                if (!response.ok || !contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    console.error("[AdminInterface] Server returned non-JSON response:", text);
                    // You might want to set an error state here to show in the UI
                    return;
                }

                const data = await response.json();
                if (response.ok) {
                    setDays(data.days);
                    setConfig(data.config);
                } else {
                    console.error("[AdminInterface] Error response from settings API:", data);
                }
            } catch (error) {
                console.error('[AdminInterface] Error fetching settings:', error);
            } finally {
                setIsLoading(false);
                console.log("[AdminInterface] Finished fetching settings.");
            }
        }
        fetchSettings();
    }, []);

    const handleDayChange = (index: number, value: string) => {
        const newDays = [...days];
        newDays[index].food_of_the_day = value;
        setDays(newDays);
    };

    const handleConfigChange = (value: string) => {
        setConfig({ ...config, current_day: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ days, config }),
            });
            if (response.ok) {
                alert('Settings updated successfully!');
            } else {
                const data = await response.json();
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error updating settings:', error);
            alert('An error occurred while updating settings.');
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-full"><p>Loading settings...</p></div>;
    }

    return (
        <div className="flex flex-col h-full p-4 md:p-6">
            <header className="flex justify-between items-center mb-4 flex-shrink-0">
                <h1 className="text-2xl font-bold">Admin Panel</h1>
                <div className="flex items-center gap-4">
                    {session?.officerName && <p>Welcome, {session.officerName}</p>}
                    <a href="/api/auth/logout">
                        <Button variant="outline">Logout</Button>
                    </a>
                    <ModeToggle />
                </div>
            </header>
            <div className="flex-grow overflow-auto py-4">
                <h2 className="text-xl font-semibold mb-4">Event Settings</h2>
                <form onSubmit={handleSubmit} className="space-y-6 max-w-md mx-auto">
                    {days.map((day, index) => (
                        <div key={day.day_number} className="space-y-2">
                            <Label htmlFor={`day-${day.day_number}`}>Food for Day {day.day_number}</Label>
                            <Input
                                id={`day-${day.day_number}`}
                                value={day.food_of_the_day}
                                onChange={(e) => handleDayChange(index, e.target.value)}
                            />
                        </div>
                    ))}
                    <div className="space-y-2">
                         <Label>Current Active Day</Label>
                         <Select value={config.current_day} onValueChange={handleConfigChange}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                            <SelectContent>
                                {days.map(d => <SelectItem key={d.day_number} value={String(d.day_number)}>Day {d.day_number}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button type="submit" className="w-full">Save Settings</Button>
                </form>
            </div>
        </div>
    );
}