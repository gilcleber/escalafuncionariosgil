
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Download, Upload, CheckCircle, Monitor } from 'lucide-react';
import { useSchedule } from '@/contexts/ScheduleContextSupabase';
import { importBackupData } from '@/services/importService';
import { toast } from 'sonner';

const MainToolbar: React.FC = () => {
    const { scheduleData } = useSchedule();
    const [isImporting, setIsImporting] = useState(false);

    const handleExportBackup = () => {
        const dataStr = JSON.stringify(scheduleData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `backup_escala_${new Date().toISOString().slice(0, 10)}.json`;

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        toast.success('Backup exportado com sucesso!');
    };

    const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm('ATENÇÃO: Importar um backup irá SOBRESCREVER ou ATUALIZAR os dados existentes.\n\nRecomendamos exportar um backup atual antes de continuar.\n\nDeseja prosseguir?')) {
            event.target.value = '';
            return;
        }

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const jsonContent = e.target?.result as string;
                const parsedData = JSON.parse(jsonContent);
                const result = await importBackupData(parsedData);

                if (result.success) {
                    toast.success(result.message);
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    toast.error('Erro na importação', {
                        description: result.message + '\n' + result.failures.join('\n')
                    });
                }
            } catch (error) {
                toast.error('Erro ao ler arquivo', { description: 'O formato não é um JSON válido.' });
                console.error(error);
            } finally {
                setIsImporting(false);
                if (event.target) event.target.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Escala de Funcionários',
                text: 'Confira a escala atualizada!',
                url: window.location.href,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            toast.success('Link copiado para a área de transferência!');
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto mb-6 px-4">
            <div className="neuro-card p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 backdrop-blur-sm">

                {/* Navigation / Date placeholders or Left side goodies */}
                <div className="flex items-center gap-2">
                    {/* Could put date navigation here if we wanted to match screenshot 100%, 
                but date nav is usually inside Calendar. 
                For now, let's keep it clean. */}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl border-neuro-border hover:bg-neuro-surface"
                        onClick={handleShare}
                    >
                        <Share2 className="h-4 w-4" />
                        Compartilhar
                    </Button>

                    <Button
                        variant="outline"
                        className="gap-2 rounded-xl border-neuro-border hover:bg-neuro-surface"
                        onClick={handleExportBackup}
                    >
                        <Download className="h-4 w-4" />
                        Exportar
                    </Button>

                    <div className="relative">
                        <Input
                            type="file"
                            accept=".json"
                            onChange={handleImportBackup}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                            disabled={isImporting}
                        />
                        <Button
                            variant="default"
                            className="gap-2 rounded-xl bg-neuro-accent text-white hover:bg-neuro-accent/90 relative z-10"
                            disabled={isImporting}
                        >
                            <Upload className="h-4 w-4" />
                            {isImporting ? 'Importando...' : 'Importar'}
                        </Button>
                    </div>

                    <div className="h-8 w-px bg-gray-200 mx-2 hidden md:block"></div>

                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Instalação Ativa</span>
                    </div>

                    <div className="p-2 bg-gray-100 rounded-xl text-gray-500">
                        <Monitor className="h-4 w-4" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainToolbar;
