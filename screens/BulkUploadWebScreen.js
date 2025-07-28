import React from 'react';
import { WebView } from 'react-native-webview';

export default function BulkUploadWebScreen() {
  return (
    <WebView
      source={{ uri: 'https://app.tnhappykids.in/backend/bulk_upload.html' }}
      style={{ flex: 1 }}
    />
  );
} 