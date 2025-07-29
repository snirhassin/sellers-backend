import React, { useState, useRef } from 'react';

interface UploadViewProps {
  token: string;
  sellerId: string | null;
}

const UploadView: React.FC<UploadViewProps> = ({ token, sellerId }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [filePreview, setFilePreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const droppedFile = files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setUploadResult(null);
        previewFile(droppedFile);
      } else {
        alert('Please upload a CSV or Excel file.');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setUploadResult(null);
      previewFile(files[0]);
    }
  };

  const previewFile = async (file: File) => {
    if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 6); // First 5 rows + header
      const preview = lines.map(line => line.split(','));
      setFilePreview(preview);
      setShowPreview(true);
    }
  };

  const fetchUploadHistory = async () => {
    if (!sellerId) return;
    
    try {
      const response = await fetch(`/api/upload/history/${sellerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUploadHistory(data.uploads || []);
      }
    } catch (err) {
      console.error('Failed to fetch upload history');
    }
  };

  const handleUpload = async () => {
    if (!file || !sellerId) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('updateExisting', updateExisting.toString());

    try {
      const response = await fetch(`/api/upload/${sellerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();
      setUploadResult(result);
      
      if (response.ok) {
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      setUploadResult({
        error: 'Network error. Make sure the backend server is running.',
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/upload/template');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'product_upload_template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download template');
    }
  };

  if (!sellerId) {
    return (
      <div className="card">
        <div className="card-content">
          <p>Please select a seller first to upload products.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Upload Instructions */}
      <div className="card">
        <div className="card-header">
          <h3>📤 Upload Product List</h3>
        </div>
        <div className="card-content">
          <div style={{ marginBottom: '20px' }}>
            <h4>Step 1: Prepare Your File</h4>
            <p style={{ color: '#7f8c8d', marginBottom: '10px' }}>
              Upload a CSV or Excel file with your product data. Required columns: ASIN, Market, Product Name, Commission Rate.
            </p>
            <button onClick={downloadTemplate} className="btn btn-secondary">
              📄 Download Template
            </button>
          </div>
          
          <div>
            <h4>Step 2: Upload File</h4>
            <div
              className={`upload-area ${dragOver ? 'dragover' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div style={{ textAlign: 'center' }}>
                {file ? (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📄</div>
                    <p><strong>{file.name}</strong></p>
                    <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
                      Size: {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '10px' }}>📁</div>
                    <p><strong>Drag & drop your CSV/Excel file here</strong></p>
                    <p style={{ color: '#7f8c8d' }}>or click to browse files</p>
                  </>
                )}
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />

            {file && (
              <div style={{ marginTop: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={updateExisting}
                      onChange={(e) => setUpdateExisting(e.target.checked)}
                    />
                    Update existing products (overwrite duplicates)
                  </label>
                </div>
                
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="btn btn-success"
                  >
                    {uploading ? '⏳ Uploading...' : '🚀 Upload Products'}
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setUploadResult(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="card">
          <div className="card-header">
            <h3>
              {uploadResult.error ? '❌ Upload Failed' : '✅ Upload Completed'}
            </h3>
          </div>
          <div className="card-content">
            {uploadResult.error ? (
              <div className="error-message">
                {uploadResult.error}
                {uploadResult.message && <div>{uploadResult.message}</div>}
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h4>📊 Summary:</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2c3e50' }}>
                        {uploadResult.summary?.totalRows || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Rows</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#d4edda', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
                        {uploadResult.summary?.successful || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#155724' }}>Successful</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#721c24' }}>
                        {uploadResult.summary?.failed || 0}
                      </div>
                      <div style={{ fontSize: '12px', color: '#721c24' }}>Failed</div>
                    </div>
                  </div>
                </div>

                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div>
                    <h4>⚠️ Errors Found:</h4>
                    <div style={{ 
                      maxHeight: '200px', 
                      overflowY: 'auto', 
                      backgroundColor: '#fff3cd', 
                      padding: '10px', 
                      borderRadius: '4px',
                      border: '1px solid #ffeaa7'
                    }}>
                      {uploadResult.errors.slice(0, 20).map((error: string, index: number) => (
                        <div key={index} style={{ fontSize: '14px', marginBottom: '5px' }}>
                          • {error}
                        </div>
                      ))}
                      {uploadResult.errors.length > 20 && (
                        <div style={{ fontSize: '14px', fontStyle: 'italic', color: '#856404' }}>
                          ... and {uploadResult.errors.length - 20} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* File Preview */}
      {showPreview && filePreview.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3>👀 File Preview</h3>
            <button 
              onClick={() => setShowPreview(false)}
              style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <div className="card-content">
            <p style={{ marginBottom: '15px', color: '#7f8c8d' }}>
              Showing first 5 rows of your file:
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    {filePreview[0]?.map((header, index) => (
                      <th key={index} style={{ 
                        padding: '10px', 
                        border: '1px solid #ddd', 
                        textAlign: 'left',
                        fontWeight: 'bold'
                      }}>
                        {header?.trim()}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filePreview.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} style={{ 
                          padding: '8px 10px', 
                          border: '1px solid #ddd',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {cell?.trim()}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => setShowPreview(false)} 
                className="btn btn-secondary"
              >
                Close Preview
              </button>
              {file && (
                <button
                  onClick={handleUpload}
                  className="btn btn-primary"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload This File'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload History */}
      <div className="card">
        <div className="card-header">
          <h3>📁 Recent Uploads</h3>
          <button 
            onClick={fetchUploadHistory}
            className="btn btn-secondary"
            style={{ fontSize: '12px' }}
          >
            🔄 Refresh
          </button>
        </div>
        <div className="card-content">
          {uploadHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
              <p>No upload history found.</p>
              <p style={{ fontSize: '14px' }}>Upload your first file to see history here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {uploadHistory.slice(0, 5).map((upload, index) => (
                <div key={index} style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  backgroundColor: upload.status === 'completed' ? '#f8f9fa' : 
                                 upload.status === 'failed' ? '#fff5f5' : '#fff3cd'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {upload.filename || 'Unknown file'}
                      </div>
                      <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                        {upload.totalRows || 0} total rows • {upload.successfulImports || 0} successful • {upload.failedImports || 0} failed
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        backgroundColor: upload.status === 'completed' ? '#d4edda' : 
                                       upload.status === 'failed' ? '#f8d7da' : '#fff3cd',
                        color: upload.status === 'completed' ? '#155724' : 
                               upload.status === 'failed' ? '#721c24' : '#856404'
                      }}>
                        {upload.status === 'completed' ? '✅ Success' : 
                         upload.status === 'failed' ? '❌ Failed' : '⏳ Processing'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>
                        {upload.createdAt ? new Date(upload.createdAt).toLocaleDateString() : 'Unknown date'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Format Guide */}
      <div className="card">
        <div className="card-header">
          <h3>📋 File Format Guide</h3>
        </div>
        <div className="card-content">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <h4>Required Columns:</h4>
              <ul style={{ paddingLeft: '20px', color: '#2c3e50' }}>
                <li><strong>asin</strong> - Product ASIN (10 characters)</li>
                <li><strong>market</strong> - Marketplace (US, UK, DE, etc.)</li>
                <li><strong>product_name</strong> - Product title</li>
                <li><strong>commission_rate</strong> - Commission % (0-50)</li>
              </ul>
            </div>
            <div>
              <h4>Optional Columns:</h4>
              <ul style={{ paddingLeft: '20px', color: '#7f8c8d' }}>
                <li><strong>description</strong> - Product description</li>
                <li><strong>price</strong> - Product price</li>
                <li><strong>currency</strong> - Currency code (USD, GBP, EUR)</li>
              </ul>
            </div>
          </div>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <strong>💡 Tips:</strong>
            <ul style={{ paddingLeft: '20px', marginTop: '10px', marginBottom: '0' }}>
              <li>Make sure your CSV has headers in the first row</li>
              <li>ASIN must be exactly 10 alphanumeric characters</li>
              <li>Commission rates should be numbers between 0 and 50</li>
              <li>Use the template to ensure proper formatting</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadView;