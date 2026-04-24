import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { dataService, reportService } from '../services/api';

function Dashboard() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileData, setFileData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeChart, setActiveChart] = useState('line');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [generatingReport, setGeneratingReport] = useState(false);
  const navigate = useNavigate();

  const loadFiles = useCallback(async () => {
    try {
      const data = await dataService.getFiles();
      setFiles(data);
    } catch (err) {
      console.error('Failed to load files', err);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      await dataService.uploadFile(file);
      await loadFiles();
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setLoading(true);
    setFileData(null);
    setXAxis('');
    setYAxis('');
    try {
      const data = await dataService.getFileData(file.id);
      setFileData(data);
      if (data.columns.length > 0) setXAxis(data.columns[0]);
      const firstNumeric = data.columns.find(col =>
        data.data.length > 0 && typeof data.data[0][col] === 'number'
      );
      if (firstNumeric) setYAxis(firstNumeric);
    } catch (err) {
      console.error('Failed to load file data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (fileId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this file?')) return;
    try {
      await dataService.deleteFile(fileId);
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setFileData(null);
      }
      await loadFiles();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleGenerateReport = async (format) => {
    if (!selectedFile) return;
    setGeneratingReport(true);
    try {
      await reportService.generateReport(selectedFile.id, format);
    } catch (err) {
      alert('Report generation failed: ' + err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  const numericColumns = fileData?.columns.filter(col =>
    fileData.data.length > 0 && typeof fileData.data[0][col] === 'number'
  ) || [];

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={{ fontSize: '22px' }}>📊</span>
          <span style={styles.sidebarTitle}>DataDash</span>
        </div>

        {/* Upload Zone */}
        <div
          style={{
            ...styles.uploadZone,
            ...(dragOver ? styles.uploadZoneActive : {}),
            ...(uploading ? { opacity: 0.6 } : {}),
          }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFileUpload(e.dataTransfer.files[0]);
          }}
          onClick={() => !uploading && document.getElementById('fileInput').click()}
        >
          <input
            id="fileInput"
            type="file"
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e.target.files[0])}
          />
          <div style={styles.uploadIcon}>{uploading ? '⏳' : '⬆️'}</div>
          <p style={styles.uploadText}>
            {uploading ? 'Uploading...' : 'Drop CSV or Excel'}
          </p>
          <p style={styles.uploadSubtext}>or click to browse</p>
        </div>

        {/* File List */}
        <div style={styles.fileListLabel}>Your files ({files.length})</div>
        <div style={styles.fileList}>
          {files.length === 0 ? (
            <p style={styles.emptyText}>No files yet</p>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                style={{
                  ...styles.fileItem,
                  ...(selectedFile?.id === file.id ? styles.fileItemActive : {}),
                }}
                onClick={() => handleSelectFile(file)}
              >
                <div style={styles.fileIcon}>📄</div>
                <div style={styles.fileInfo}>
                  <div style={styles.fileName}>{file.original_filename}</div>
                  <div style={styles.fileMeta}>
                    {file.row_count} rows · {file.column_count} cols
                  </div>
                </div>
                <button
                  style={styles.deleteBtn}
                  onClick={(e) => handleDelete(file.id, e)}
                  title="Delete"
                >✕</button>
              </div>
            ))
          )}
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          Sign out
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.main}>
        {!selectedFile ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyStateIcon}>📈</div>
            <h2 style={styles.emptyStateTitle}>No file selected</h2>
            <p style={styles.emptyStateText}>
              Upload a CSV or Excel file and select it to visualize your data
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={styles.header}>
              <div>
                <h1 style={styles.headerTitle}>{selectedFile.original_filename}</h1>
                <p style={styles.headerMeta}>
                  {selectedFile.row_count} rows · {selectedFile.column_count} columns · {selectedFile.file_size} KB
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  style={{
                    ...styles.reportBtn,
                    opacity: generatingReport ? 0.6 : 1,
                  }}
                  onClick={() => handleGenerateReport('pdf')}
                  disabled={generatingReport}
                  title="Export PDF"
                >
                  {generatingReport ? '⏳' : '📄'} PDF
                </button>
                <button
                  style={{
                    ...styles.reportBtn,
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#10b981',
                    opacity: generatingReport ? 0.6 : 1,
                  }}
                  onClick={() => handleGenerateReport('word')}
                  disabled={generatingReport}
                  title="Export Word"
                >
                  {generatingReport ? '⏳' : '📝'} Word
                </button>
                <div style={styles.headerBadge}>
                  {selectedFile.column_count} columns
                </div>
              </div>
            </div>

            {loading ? (
              <div style={styles.loading}>
                <div style={styles.spinner} />
                <p style={{ color: '#94a3b8', marginTop: '16px' }}>Loading data...</p>
              </div>
            ) : fileData ? (
              <>
                {/* Stats Cards */}
                <div style={styles.statsGrid}>
                  {[
                    { label: 'Total Rows', value: fileData.total_rows, icon: '📋' },
                    { label: 'Columns', value: fileData.columns.length, icon: '📊' },
                    { label: 'Numeric Cols', value: numericColumns.length, icon: '🔢' },
                    { label: 'File Size', value: `${selectedFile.file_size} KB`, icon: '💾' },
                  ].map((stat) => (
                    <div key={stat.label} style={styles.statCard}>
                      <div style={styles.statIcon}>{stat.icon}</div>
                      <div style={styles.statValue}>{stat.value}</div>
                      <div style={styles.statLabel}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Chart Section */}
                {numericColumns.length > 0 && (
                  <div style={styles.chartCard}>
                    <div style={styles.chartHeader}>
                      <h3 style={styles.chartTitle}>Data Visualization</h3>
                      <div style={styles.chartControls}>
                        <select
                          style={styles.select}
                          value={xAxis}
                          onChange={(e) => setXAxis(e.target.value)}
                        >
                          {fileData.columns.map(col => (
                            <option key={col} value={col}>{col} (X)</option>
                          ))}
                        </select>
                        <select
                          style={styles.select}
                          value={yAxis}
                          onChange={(e) => setYAxis(e.target.value)}
                        >
                          {numericColumns.map(col => (
                            <option key={col} value={col}>{col} (Y)</option>
                          ))}
                        </select>
                        <div style={styles.chartTypeBtns}>
                          {['line', 'bar'].map((type) => (
                            <button
                              key={type}
                              style={{
                                ...styles.chartTypeBtn,
                                ...(activeChart === type ? styles.chartTypeBtnActive : {}),
                              }}
                              onClick={() => setActiveChart(type)}
                            >
                              {type === 'line' ? '📈' : '📊'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                      {activeChart === 'line' ? (
                        <LineChart data={fileData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey={xAxis} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                          />
                          <Legend />
                          <Line type="monotone" dataKey={yAxis} stroke="#6c63ff" strokeWidth={2} dot={{ fill: '#6c63ff', r: 3 }} />
                        </LineChart>
                      ) : (
                        <BarChart data={fileData.data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey={xAxis} stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis stroke="#475569" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{ background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                          />
                          <Legend />
                          <Bar dataKey={yAxis} fill="#6c63ff" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Data Table */}
                <div style={styles.tableCard}>
                  <h3 style={styles.tableTitle}>
                    Data Preview <span style={styles.tableCount}>({fileData.total_rows} rows)</span>
                  </h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          {fileData.columns.map((col) => (
                            <th key={col} style={styles.th}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fileData.data.map((row, i) => (
                          <tr key={i} style={i % 2 === 0 ? styles.trEven : styles.trOdd}>
                            {fileData.columns.map((col) => (
                              <td key={col} style={{
                                ...styles.td,
                                ...(row[col] === 'CRITICAL' ? styles.tdCritical :
                                  row[col] === 'WARNING' ? styles.tdWarning :
                                  row[col] === 'OK' ? styles.tdOk : {}),
                              }}>
                                {String(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f0f13' },
  sidebar: {
    width: '260px',
    minWidth: '260px',
    background: '#1a1a24',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    gap: '16px',
    overflowY: 'auto',
  },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: '10px', padding: '0 8px 8px' },
  sidebarTitle: { fontSize: '18px', fontWeight: '700', color: '#6c63ff' },
  uploadZone: {
    border: '2px dashed rgba(108,99,255,0.3)',
    borderRadius: '12px',
    padding: '20px 12px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'rgba(108,99,255,0.05)',
  },
  uploadZoneActive: {
    border: '2px dashed #6c63ff',
    background: 'rgba(108,99,255,0.15)',
  },
  uploadIcon: { fontSize: '24px', marginBottom: '8px' },
  uploadText: { fontSize: '13px', fontWeight: '500', color: '#e2e8f0', marginBottom: '4px' },
  uploadSubtext: { fontSize: '11px', color: '#475569' },
  fileListLabel: { fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px' },
  fileList: { flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' },
  emptyText: { fontSize: '13px', color: '#475569', textAlign: 'center', padding: '16px 0' },
  fileItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'background 0.15s',
    border: '1px solid transparent',
  },
  fileItemActive: {
    background: 'rgba(108,99,255,0.15)',
    border: '1px solid rgba(108,99,255,0.3)',
  },
  fileIcon: { fontSize: '16px', flexShrink: 0 },
  fileInfo: { flex: 1, minWidth: 0 },
  fileName: { fontSize: '13px', fontWeight: '500', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  fileMeta: { fontSize: '11px', color: '#475569', marginTop: '2px' },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '12px',
    padding: '4px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  logoutBtn: {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#94a3b8',
    borderRadius: '10px',
    padding: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    marginTop: 'auto',
  },
  main: { flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' },
  emptyStateIcon: { fontSize: '64px', opacity: 0.3 },
  emptyStateTitle: { fontSize: '24px', fontWeight: '600', color: '#475569' },
  emptyStateText: { fontSize: '14px', color: '#334155', maxWidth: '320px', textAlign: 'center', lineHeight: 1.6 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' },
  headerTitle: { fontSize: '22px', fontWeight: '700', color: '#e2e8f0' },
  headerMeta: { fontSize: '13px', color: '#475569', marginTop: '4px' },
  headerBadge: { background: 'rgba(108,99,255,0.15)', color: '#6c63ff', border: '1px solid rgba(108,99,255,0.3)', borderRadius: '20px', padding: '6px 14px', fontSize: '13px', fontWeight: '500' },
  reportBtn: {
    background: 'rgba(108,99,255,0.15)',
    border: '1px solid rgba(108,99,255,0.3)',
    color: '#6c63ff',
    borderRadius: '10px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  loading: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  spinner: { width: '36px', height: '36px', border: '3px solid rgba(108,99,255,0.2)', borderTop: '3px solid #6c63ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' },
  statCard: { background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px 16px', textAlign: 'center' },
  statIcon: { fontSize: '24px', marginBottom: '8px' },
  statValue: { fontSize: '24px', fontWeight: '700', color: '#e2e8f0', marginBottom: '4px' },
  statLabel: { fontSize: '12px', color: '#475569', fontWeight: '500' },
  chartCard: { background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' },
  chartHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' },
  chartTitle: { fontSize: '16px', fontWeight: '600', color: '#e2e8f0' },
  chartControls: { display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' },
  select: { background: '#252535', border: '1px solid rgba(255,255,255,0.08)', color: '#e2e8f0', borderRadius: '8px', padding: '6px 10px', fontSize: '13px', cursor: 'pointer', outline: 'none' },
  chartTypeBtns: { display: 'flex', gap: '4px' },
  chartTypeBtn: { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '14px' },
  chartTypeBtnActive: { background: 'rgba(108,99,255,0.2)', border: '1px solid rgba(108,99,255,0.4)' },
  tableCard: { background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '24px' },
  tableTitle: { fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '16px' },
  tableCount: { fontSize: '13px', color: '#475569', fontWeight: '400' },
  tableWrapper: { overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  th: { background: '#252535', padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' },
  trEven: { background: 'transparent' },
  trOdd: { background: 'rgba(255,255,255,0.02)' },
  td: { padding: '10px 16px', color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' },
  tdCritical: { color: '#ef4444', fontWeight: '600' },
  tdWarning: { color: '#f59e0b', fontWeight: '600' },
  tdOk: { color: '#10b981', fontWeight: '600' },
};

export default Dashboard;