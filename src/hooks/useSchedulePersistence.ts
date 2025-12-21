import { useState, useEffect, useRef, useCallback } from 'react';
import { ScheduleData } from '@/types/employee';
import { scheduleService, createDefaultScheduleData } from '@/services/scheduleService';
import { supabase } from '@/integrations/supabase/client';

export const useSchedulePersistence = () => {
    const [scheduleData, setScheduleData] = useState<ScheduleData>(createDefaultScheduleData());
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const saveTimeoutRef = useRef<any | null>(null);
    const lastSavedDataRef = useRef<string>('');
    const isInitialLoad = useRef(true);

    // Manual save function exposed to the context
    const manualSave = useCallback(async (data: ScheduleData) => {
        if (isSaving) return;

        setIsSaving(true);
        try {
            await scheduleService.save(data);
            lastSavedDataRef.current = JSON.stringify(data);
            console.log('✅ Dados salvos manualmente');
        } catch (error) {
            console.error('Error saving data manually:', error);
        } finally {
            setTimeout(() => {
                setIsSaving(false);
            }, 1000);
        }
    }, [isSaving]);

    // Load initial data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const data = await scheduleService.load();
                if (data) {
                    setScheduleData(data);
                    lastSavedDataRef.current = JSON.stringify(data);
                }
                isInitialLoad.current = false;
            } catch (error) {
                console.error('Error loading data:', error);
                // Keep default data if load fails, but mark as loaded
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Listen for real-time updates from Supabase
    useEffect(() => {
        const channel = supabase
            .channel('schedule-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'schedule_data'
                },
                async (payload: any) => {
                    if (payload.new && payload.new.data) {
                        const newDataString = typeof payload.new.data === 'string'
                            ? payload.new.data
                            : JSON.stringify(payload.new.data);

                        // Only update if the data is actually different from what we have
                        if (newDataString !== lastSavedDataRef.current && !isInitialLoad.current) {
                            console.log('🔄 Atualizando dados do Supabase (Real-time)');
                            try {
                                const newData = JSON.parse(newDataString);
                                setScheduleData(newData);
                                lastSavedDataRef.current = newDataString;
                            } catch (e) {
                                console.error('Error parsing real-time update', e);
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Listen for updates from other tabs
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'scheduleData' && event.newValue && !isInitialLoad.current) {
                try {
                    const newData = JSON.parse(event.newValue);
                    const { lastUpdated, ...cleanData } = newData;
                    const newDataString = JSON.stringify(cleanData);

                    if (newDataString !== lastSavedDataRef.current) {
                        setScheduleData(cleanData);
                        lastSavedDataRef.current = newDataString;
                        console.log('🔄 Dados sincronizados de outra aba');
                    }
                } catch (error) {
                    console.error('Error parsing storage data:', error);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    // Debounced auto-save
    useEffect(() => {
        if (isInitialLoad.current || isLoading) return;

        const currentDataString = JSON.stringify(scheduleData);

        // Only save if data actually changed
        // We ignore isSaving check here to allow queueing a new save if user keeps typing
        if (currentDataString !== lastSavedDataRef.current) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(async () => {
                setIsSaving(true);
                try {
                    await scheduleService.save(scheduleData);
                    lastSavedDataRef.current = currentDataString;

                    // Sync across tabs
                    window.dispatchEvent(new StorageEvent('storage', {
                        key: 'scheduleData',
                        newValue: JSON.stringify({
                            ...scheduleData,
                            lastUpdated: Date.now()
                        }),
                        oldValue: null,
                        storageArea: localStorage,
                        url: window.location.href
                    }));

                } catch (error) {
                    console.error('Error saving data:', error);
                } finally {
                    setTimeout(() => {
                        setIsSaving(false);
                    }, 500);
                }
            }, 2000); // 2 seconds debounce
        }

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [scheduleData, isLoading]);

    return {
        scheduleData,
        setScheduleData,
        isLoading,
        isSaving,
        manualSave
    };
};
