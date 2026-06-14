import { useState, useEffect } from 'react';
import axios from 'axios';

export default function PrinterTest() {
    const [testResults, setTestResults] = useState({});
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState({});
    const [config, setConfig] = useState({
        printerName: 'EPSON_POS',
        timeout: 30000,
    });

    const runTest = async (testType) => {
        setLoading(prev => ({ ...prev, [testType]: true }));
        
        try {
            const startTime = Date.now();
            const response = await axios.get(`/admin/printer/test/${testType}`, {
                timeout: config.timeout,
            });
            const elapsed = Date.now() - startTime;
            
            setTestResults(prev => ({
                ...prev,
                [testType]: {
                    success: true,
                    data: response.data,
                    frontendElapsed: elapsed,
                }
            }));
        } catch (error) {
            const elapsed = Date.now() - startTime;
            setTestResults(prev => ({
                ...prev,
                [testType]: {
                    success: false,
                    error: error.response?.data || error.message,
                    frontendElapsed: elapsed,
                }
            }));
        }
        
        setLoading(prev => ({ ...prev, [testType]: false }));
        fetchLogs();
    };

    const fetchLogs = async () => {
        try {
            const response = await axios.get('/admin/printer/test/logs');
            setLogs(response.data.logs || []);
        } catch (error) {
            console.error('Failed to fetch logs:', error);
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const TestButton = ({ type, label, description }) => (
        <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h3 className="font-semibold text-gray-800">{label}</h3>
                    <p className="text-sm text-gray-600">{description}</p>
                </div>
                <button
                    onClick={() => runTest(type)}
                    disabled={loading[type]}
                    className={`px-4 py-2 rounded font-medium ${
                        loading[type]
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                >
                    {loading[type] ? 'Running...' : 'Run Test'}
                </button>
            </div>
            
            {testResults[type] && (
                <div className={`mt-3 p-3 rounded text-sm ${
                    testResults[type].success 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    <div className="font-medium mb-1">
                        {testResults[type].success ? '✓ Success' : '✗ Failed'}
                    </div>
                    <div>Frontend Time: {testResults[type].frontendElapsed}ms</div>
                    {testResults[type].data?.elapsed_ms && (
                        <div>Backend Time: {testResults[type].data.elapsed_ms}ms</div>
                    )}
                    {testResults[type].data?.message && (
                        <div className="mt-1">{testResults[type].data.message}</div>
                    )}
                    {testResults[type].error?.message && (
                        <div className="mt-1">{testResults[type].error.message}</div>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Printer Diagnostic & Testing</h1>
            
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-6">
                <p className="text-sm text-yellow-800">
                    <strong>Panduan Troubleshooting:</strong>
                    <ol className="list-decimal ml-5 mt-1 space-y-1">
                        <li>Jalankan <strong>Test 1 (Connection)</strong> untuk cek koneksi printer</li>
                        <li>Jika timeout, cek nama printer di Control Panel Windows</li>
                        <li>Jalankan <strong>Test 2 (Simple Text)</strong> untuk cek encoding karakter</li>
                        <li>Jika ada simbol "?", cek cleanText() function</li>
                        <li>Jalankan <strong>Test 3 (Full Receipt)</strong> untuk cek flow lengkap</li>
                    </ol>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="font-semibold mb-2 text-gray-700">Configuration</h2>
                    <div className="text-sm space-y-1 text-gray-600">
                        <div>Printer: <span className="font-mono bg-gray-100 px-1 rounded">{config.printerName}</span></div>
                        <div>Timeout: {config.timeout}ms</div>
                    </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow">
                    <h2 className="font-semibold mb-2 text-gray-700">Test Endpoints</h2>
                    <div className="text-xs space-y-1 font-mono text-gray-600">
                        <div>GET /admin/printer/test/connection</div>
                        <div>GET /admin/printer/test/simple</div>
                        <div>GET /admin/printer/test/full</div>
                        <div>GET /admin/printer/test/encoding</div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <h2 className="text-lg font-semibold text-gray-800">Test Scenarios</h2>
                
                <TestButton
                    type="connection"
                    label="Test 1: Connection Only"
                    description="Initialize printer dan close. Test koneksi dasar tanpa mencetak."
                />
                
                <TestButton
                    type="simple"
                    label="Test 2: Simple Text"
                    description="Cetak teks ASCII dasar (Hello World). Test encoding karakter."
                />
                
                <TestButton
                    type="encoding"
                    label="Test 3: Encoding Test"
                    description="Cetak berbagai karakter untuk test cleanText() function."
                />
                
                <TestButton
                    type="full"
                    label="Test 4: Full Receipt"
                    description="Cetak struk lengkap dengan data dummy. Test semua komponen."
                />
            </div>

            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-white font-semibold">Recent Printer Logs</h2>
                    <button 
                        onClick={fetchLogs}
                        className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white"
                    >
                        Refresh
                    </button>
                </div>
                {logs.length === 0 ? (
                    <div className="text-gray-500">No logs found...</div>
                ) : (
                    logs.map((log, index) => (
                        <div key={index} className="whitespace-pre-wrap mb-1">
                            {log}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
