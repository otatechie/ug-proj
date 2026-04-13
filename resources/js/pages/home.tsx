import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, AlignJustify, CheckCircle2, Download, Loader2, Send, Shield, ShieldAlert, Trash2, Upload, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { store } from '@/routes/analyze';

interface SampleLogs {
    suspicious: string;
    normal: string;
}

interface Analysis {
    summary: string;
    risk_level: string;
    anomalies: string[];
    attack_patterns: string[];
    mitigations: string[];
    simulated?: boolean;
    analyzed_at?: string;
}

interface Props {
    sampleLogs: SampleLogs;
    activeTab: string | null;
    analysis: Analysis | null;
    error: string | null;
    initialLogContent?: string | null;
}

const riskColors: Record<string, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700',
    unknown: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600',
};

const formatDateTime = (iso: string): string => {
    const d = new Date(iso);
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${date}, ${time}`;
};

const riskGauge: Record<string, { fill: number; bar: string }> = {
    low: { fill: 20, bar: 'bg-green-500 dark:bg-green-400' },
    medium: { fill: 45, bar: 'bg-amber-500 dark:bg-amber-400' },
    high: { fill: 70, bar: 'bg-orange-500 dark:bg-orange-400' },
    critical: { fill: 95, bar: 'bg-red-500 dark:bg-red-400' },
    unknown: { fill: 50, bar: 'bg-gray-500 dark:bg-gray-400' },
};

export default function Home({
    sampleLogs,
    analysis,
    error,
    initialLogContent,
}: Props) {
    const [menuOpen, setMenuOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data, setData, post, processing, errors } = useForm({
        log_content: initialLogContent ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(store.url(), { forceFormData: false });
    };

    const loadSample = (key: keyof SampleLogs) => {
        setData('log_content', sampleLogs[key]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result;
            if (typeof text === 'string') setData('log_content', text);
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const scrollTo = (id: string) => {
        setMenuOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const exportReport = (a: Analysis) => {
        const lines = [
            'AI Cybersecurity — Log Analysis Report',
            a.analyzed_at ? `Generated: ${formatDateTime(a.analyzed_at)}` : '',
            '',
            `Risk level: ${a.risk_level}`,
            '',
            'Summary',
            a.summary,
            '',
            ...(a.anomalies.length > 0 ? ['Anomalies', ...a.anomalies.map((x) => `• ${x}`), ''] : []),
            ...(a.attack_patterns.length > 0 ? ['Attack patterns', ...a.attack_patterns.map((x) => `• ${x}`), ''] : []),
            ...(a.mitigations.length > 0 ? ['Recommended mitigations', ...a.mitigations.map((x, i) => `${i + 1}. ${x}`)] : []),
        ];
        const blob = new Blob([lines.filter(Boolean).join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const aEl = document.createElement('a');
        aEl.href = url;
        aEl.download = `log-analysis-${new Date().toISOString().slice(0, 10)}.txt`;
        aEl.click();
        URL.revokeObjectURL(url);
    };

    // Close mobile menu on Escape; lock body scroll while open
    useEffect(() => {
        if (!menuOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
        document.addEventListener('keydown', handler);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handler);
            document.body.style.overflow = '';
        };
    }, [menuOpen]);

    const resultsRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (!analysis) return;
        const el = resultsRef.current;
        if (!el) return;
        const id = setTimeout(() => {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
        return () => clearTimeout(id);
    }, [analysis]);

    return (
        <>
            <Head title="AI Cybersecurity">
                <meta
                    name="description"
                    content="AI-assisted cybersecurity awareness and threat detection"
                />
            </Head>
            <main
                className="min-h-screen flex flex-col bg-[url('/dot-pattern-bg.svg')] bg-size-[20px_20px] dark:bg-none dark:bg-gray-900 text-base text-gray-800 dark:text-gray-200 pb-[env(safe-area-inset-bottom)] overflow-x-hidden"
                style={{ minHeight: '100dvh' }}
            >
                {/* Nav */}
                <nav className="flex items-center justify-between w-full md:px-16 lg:px-24 xl:px-32 py-3 md:py-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <a href="/" className="flex items-center gap-2 min-h-[44px] rounded-lg hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 cursor-pointer">
                        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
                            <Shield className="w-5 h-5 text-white" strokeWidth={2} />
                        </div>
                        <span className="font-bold text-slate-800 dark:text-gray-100 text-base">
                            AI Cybersecurity
                        </span>
                    </a>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-8 font-medium">
                        <button type="button" onClick={() => scrollTo('analyze')} className="py-2 px-3 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                            Analyze logs
                        </button>
                        <button type="button" onClick={() => scrollTo('overview')} className="py-2 px-3 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                            Overview
                        </button>
                        <button type="button" onClick={() => scrollTo('ethics')} className="py-2 px-3 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
                            Security & ethics
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={() => scrollTo('analyze')}
                        className="hidden md:inline-flex px-6 py-2.5 text-white bg-primary font-medium hover:bg-primary-hover transition active:scale-95 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 cursor-pointer"
                    >
                        Analyze logs
                    </button>

                    {/* Mobile hamburger */}
                    <button
                        type="button"
                        aria-label="Open menu"
                        aria-expanded={menuOpen}
                        aria-controls="mobile-menu"
                        className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                        onClick={() => setMenuOpen(true)}
                    >
                        <AlignJustify className="w-6 h-6" />
                    </button>
                </nav>

                {/* Mobile menu: backdrop + slide-in drawer */}
                <div
                    className={`md:hidden fixed inset-0 z-[60] bg-black/50 transition-opacity duration-200 ${
                        menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                    onClick={() => setMenuOpen(false)}
                    aria-hidden="true"
                />
                <aside
                    id="mobile-menu"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Main menu"
                    className={`md:hidden fixed top-0 right-0 bottom-0 z-[70] w-[80%] max-w-xs bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 ease-out ${
                        menuOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
                    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
                >
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                                <Shield className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-gray-100">Menu</span>
                        </div>
                        <button
                            type="button"
                            aria-label="Close menu"
                            onClick={() => setMenuOpen(false)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
                        <button
                            type="button"
                            onClick={() => scrollTo('analyze')}
                            className="flex items-center min-h-[48px] px-4 rounded-lg text-base font-medium text-slate-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                        >
                            Analyze logs
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo('overview')}
                            className="flex items-center min-h-[48px] px-4 rounded-lg text-base font-medium text-slate-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                        >
                            Overview
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollTo('ethics')}
                            className="flex items-center min-h-[48px] px-4 rounded-lg text-base font-medium text-slate-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                        >
                            Security & ethics
                        </button>
                    </nav>
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={() => scrollTo('analyze')}
                            className="w-full min-h-[48px] px-6 text-white bg-primary font-medium hover:bg-primary-hover active:scale-[0.98] rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 cursor-pointer"
                        >
                            Start analyzing
                        </button>
                    </div>
                </aside>

                {/* Hero */}
                <div className="flex flex-col items-center justify-center flex-1 w-full py-8 md:py-16 text-center px-4 sm:px-6">
                    <h1 className="text-[28px] leading-tight sm:text-4xl md:text-[40px] font-bold max-w-2xl w-full text-slate-800 dark:text-gray-100 text-balance">
                        What do you want to analyze?
                    </h1>
                    <p className="text-base mt-4 md:mt-6 text-slate-600 dark:text-gray-400 max-w-lg text-pretty">
                        Paste logs and get AI-powered threat detection and mitigation suggestions.
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-gray-500 max-w-xl">
                        Content is sent for analysis only and is not stored.
                    </p>
                    <form onSubmit={submit} id="analyze" className="max-w-3xl w-full mt-6 md:mt-8 scroll-mt-24">
                        {error && (
                            <div className="mb-4 rounded-xl border border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-800 dark:text-red-200" role="alert">
                                <p className="font-medium">{error}</p>
                                <p className="mt-1 opacity-90">Try again or use a sample above. If the problem continues, check your connection.</p>
                            </div>
                        )}
                        <div className="bg-white/50 dark:bg-gray-800/90 border border-slate-200/90 dark:border-gray-600 rounded-xl overflow-hidden hover:border-slate-300/80 dark:hover:border-gray-500 focus-within:border-primary/50 dark:focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/15 dark:focus-within:ring-primary/25 transition-colors">
                            <textarea
                                id="log_content"
                                value={data.log_content}
                                onChange={(e) => setData('log_content', e.target.value)}
                                placeholder="Paste log lines or describe what you want to analyze..."
                                rows={5}
                                className="w-full p-4 pb-0 resize-none outline-none bg-transparent text-slate-800 dark:text-gray-200 placeholder:text-slate-500 dark:placeholder:text-gray-500 min-h-[140px] text-base"
                                aria-invalid={!!errors.log_content}
                                aria-describedby={errors.log_content ? 'log_content-error' : undefined}
                            />
                            <div className="flex items-center justify-between pb-2 px-2 md:px-4 pt-2 gap-2 border-t border-slate-200/70 dark:border-gray-600/80" aria-live="polite" aria-busy={processing}>
                                <div className="flex items-center gap-1.5 min-w-0">
                                    {data.log_content.length > 40000 && (
                                        <span className={`hidden sm:inline text-xs tabular-nums ${data.log_content.length >= 50000 ? 'text-red-500 dark:text-red-400 font-medium' : 'text-amber-500 dark:text-amber-400'}`} aria-live="polite">
                                            {data.log_content.length.toLocaleString()} / 50,000
                                        </span>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".log,.txt,text/plain"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={processing}
                                        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg border border-slate-200/90 dark:border-gray-600 bg-white/60 dark:bg-gray-700/80 hover:bg-slate-100/80 dark:hover:bg-gray-600 hover:border-slate-300/80 dark:hover:border-gray-500 text-slate-500 dark:text-gray-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:ring-offset-1 dark:focus-visible:ring-offset-gray-800 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                        aria-label="Upload file"
                                    >
                                        <Upload className="w-5 h-5" strokeWidth={2} aria-hidden />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setData('log_content', '')}
                                        disabled={processing || !data.log_content.trim()}
                                        className="flex items-center justify-center min-h-[44px] min-w-[44px] p-2 rounded-lg border border-slate-200/90 dark:border-gray-600 bg-white/60 dark:bg-gray-700/80 hover:bg-slate-100/80 dark:hover:bg-gray-600 text-slate-500 dark:text-gray-400 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-primary/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                                        aria-label="Clear log content"
                                    >
                                        <Trash2 className="w-5 h-5" strokeWidth={2} aria-hidden />
                                    </button>
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing || !data.log_content.trim()}
                                    className="flex items-center justify-center gap-2 min-h-[44px] px-3 sm:px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 transition-colors text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                                    aria-label={processing ? 'Analyzing' : 'Analyze'}
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 shrink-0 animate-spin" strokeWidth={2} aria-hidden />
                                            <span className="text-sm font-medium hidden sm:inline">Analyzing…</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
                                            <span className="text-sm font-medium">Analyze</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                        {errors.log_content && (
                            <p id="log_content-error" className="mt-2 text-red-600 dark:text-red-400 text-sm" role="alert">
                                {errors.log_content}
                            </p>
                        )}
                    </form>
                    <p className="sr-only" id="suggestions-desc">Quick options to get started</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-6 md:mt-8 max-w-3xl w-full text-slate-600 dark:text-gray-400" aria-labelledby="suggestions-desc">
                        <button
                            type="button"
                            onClick={() => loadSample('suspicious')}
                            className="min-h-[48px] p-4 rounded-xl border border-slate-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 hover:border-primary dark:hover:border-primary hover:bg-orange-50/50 dark:hover:bg-gray-700/50 active:scale-[0.99] transition-colors text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Load suspicious sample
                        </button>
                        <button
                            type="button"
                            onClick={() => loadSample('normal')}
                            className="min-h-[48px] p-4 rounded-xl border border-slate-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 hover:border-primary dark:hover:border-primary hover:bg-orange-50/50 dark:hover:bg-gray-700/50 active:scale-[0.99] transition-colors text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Load normal sample
                        </button>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="min-h-[48px] p-4 rounded-xl border border-slate-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 hover:border-primary dark:hover:border-primary hover:bg-orange-50/50 dark:hover:bg-gray-700/50 active:scale-[0.99] transition-colors text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            Upload a log file
                        </button>
                    </div>
                </div>

                {/* Results */}
                {analysis && (
                    <section ref={resultsRef} className="w-full max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-12 border-t border-slate-200 dark:border-gray-700 bg-slate-50/80 dark:bg-gray-900/80 scroll-mt-24" aria-labelledby="results-heading">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                            <h2 id="results-heading" className="text-xl md:text-2xl font-bold text-slate-800 dark:text-gray-100 flex items-center gap-2">
                                <Shield className="w-6 h-6 text-primary" strokeWidth={2} aria-hidden />
                                Analysis results
                            </h2>
                            <div className="flex flex-wrap items-center gap-2">
                                <button type="button" onClick={() => exportReport(analysis)} className="text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-800 dark:hover:text-gray-200 flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-3 py-1.5 -m-1.5 cursor-pointer">
                                    <Download className="w-4 h-4" strokeWidth={2} aria-hidden />
                                    Export report
                                </button>
                                <button type="button" onClick={() => scrollTo('analyze')} className="text-sm font-medium text-primary hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 rounded px-3 py-1.5 -m-1.5 cursor-pointer">
                                    Analyze again
                                </button>
                            </div>
                        </div>
                        {analysis.analyzed_at && (
                            <p className="text-xs text-slate-500 dark:text-gray-500 mt-1 mb-6" role="status">
                                Analyzed at {formatDateTime(analysis.analyzed_at)}
                            </p>
                        )}
                        {analysis.simulated && (
                            <div className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/25 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3 mb-6">
                                <p className="font-medium">No API key set — showing simulated analysis.</p>
                                <p className="mt-1 text-amber-700 dark:text-amber-300/90">Simulated results are fixed sample data, so they look the same every time. Add <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs">OPENAI_API_KEY</code> or <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs">OPENROUTER_API_KEY</code> to your <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900/50 rounded text-xs">.env</code> and restart the app for unique AI analysis.</p>
                            </div>
                        )}

                        {/* Risk + Summary card */}
                        <div className="rounded-2xl border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-800/80 shadow-sm overflow-hidden mb-6">
                            <div className="px-5 py-4 border-b border-slate-100 dark:border-gray-700">
                                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                    <span className="text-sm font-medium text-slate-600 dark:text-gray-400">Risk level</span>
                                    <span className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-sm font-semibold capitalize ${riskColors[analysis.risk_level.toLowerCase()] ?? riskColors.unknown}`}>
                                        {analysis.risk_level}
                                    </span>
                                </div>
                                {(() => {
                                    const key = analysis.risk_level.toLowerCase();
                                    const { fill, bar } = riskGauge[key] ?? riskGauge.unknown;
                                    return (
                                        <div
                                            className="h-2 w-full rounded-full bg-slate-200 dark:bg-gray-600 overflow-hidden"
                                            role="meter"
                                            aria-valuenow={fill}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-label={`Risk level: ${analysis.risk_level}`}
                                        >
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 ease-out ${bar}`}
                                                style={{ width: `${fill}%` }}
                                            />
                                        </div>
                                    );
                                })()}
                                <div className="flex justify-between mt-1.5 text-[10px] uppercase tracking-wider text-slate-400 dark:text-gray-500 font-medium">
                                    <span>Low</span>
                                    <span>Critical</span>
                                </div>
                            </div>
                            <p className="px-5 py-4 text-slate-600 dark:text-gray-400 text-sm leading-relaxed">
                                {analysis.summary}
                            </p>
                        </div>

                        {analysis.anomalies.length === 0 && analysis.attack_patterns.length === 0 && analysis.mitigations.length === 0 ? (
                            <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-900/10 px-5 py-6 flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="w-5 h-5 shrink-0" strokeWidth={2} aria-hidden />
                                <p className="text-sm font-medium">No anomalies, attack patterns, or mitigations identified — logs appear clean.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(240px,1fr))]">
                                {analysis.anomalies.length > 0 && (
                                    <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/50 dark:bg-amber-900/10 p-4">
                                        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                                            Anomalies
                                        </h3>
                                        <ul className="space-y-2 text-sm text-slate-700 dark:text-gray-300">
                                            {analysis.anomalies.map((a, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" aria-hidden>•</span>
                                                    <span>{a}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {analysis.attack_patterns.length > 0 && (
                                    <div className="rounded-2xl border border-red-200/80 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10 p-4">
                                        <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-3 flex items-center gap-2">
                                            <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                                            Attack patterns
                                        </h3>
                                        <ul className="space-y-2 text-sm text-slate-700 dark:text-gray-300">
                                            {analysis.attack_patterns.map((p, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-red-500 dark:text-red-400 mt-0.5 shrink-0" aria-hidden>•</span>
                                                    <span>{p}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {analysis.mitigations.length > 0 && (
                                    <div className="rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/30 dark:bg-emerald-900/10 p-4">
                                        <h3 className="text-sm font-semibold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} aria-hidden />
                                            Mitigations
                                        </h3>
                                        <ul className="space-y-2 text-sm text-slate-700 dark:text-gray-300">
                                            {analysis.mitigations.map((m, i) => (
                                                <li key={i} className="flex gap-2">
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-medium shrink-0" aria-hidden>{i + 1}.</span>
                                                    <span>{m}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* Overview */}
                <section id="overview" className="w-full max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-12 scroll-mt-24">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-gray-100 mb-4">Overview</h2>
                    <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed max-w-prose">
                        AI-assisted log analysis for cybersecurity awareness and threat detection. Paste or upload logs above;
                        the system identifies anomalies, attack patterns, and suggests mitigations. Use simulated samples to try it without an API key.
                    </p>
                    <ul className="list-disc list-inside mt-4 text-slate-600 dark:text-gray-400 text-sm space-y-1">
                        <li>Threat detection from log patterns</li>
                        <li>Anomaly and attack-pattern identification</li>
                        <li>AI-driven mitigation suggestions</li>
                    </ul>
                </section>

                {/* Ethics */}
                <section id="ethics" className="w-full max-w-5xl mx-auto px-4 md:px-8 py-10 md:py-12 border-t border-slate-200 dark:border-gray-700 scroll-mt-24">
                    <h2 className="text-lg md:text-xl font-bold text-slate-800 dark:text-gray-100 mb-4">Security & ethics</h2>
                    <div className="space-y-4 text-slate-600 dark:text-gray-400 text-sm leading-relaxed max-w-prose">
                        <p>
                            This tool uses AI to analyze logs for awareness and threat detection. Log content is not stored long-term; use anonymized or simulated data where possible.
                        </p>
                        <p>
                            Logs are sent to the AI provider only for analysis. Do not paste real PII or credentials. Comply with your organization’s policies and applicable laws.
                        </p>
                        <p>
                            Use only necessary data, anonymize where possible, and keep access and use transparent and governed.
                        </p>
                    </div>
                </section>

                <footer className="pt-6 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-slate-200 dark:border-gray-700 mt-8">
                    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-slate-500 dark:text-gray-400 text-center">
                        <p className="order-2 sm:order-1">
                            © {new Date().getFullYear()} AI Cybersecurity
                        </p>
                        <div className="order-1 sm:order-2 flex items-center gap-4">
                            <button type="button" onClick={() => scrollTo('ethics')} className="underline-offset-2 hover:underline hover:text-slate-700 dark:hover:text-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-pointer">
                                Security & ethics
                            </button>
                        </div>
                    </div>
                </footer>
            </main>
        </>
    );
}
