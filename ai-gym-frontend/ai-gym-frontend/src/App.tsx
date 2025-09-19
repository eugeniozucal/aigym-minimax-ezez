import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Communities } from './pages/Communities'
import UsersPage from './pages/Users'
import Tags from './pages/Tags'
import CommunityConfig from './pages/CommunityConfig'
import UserDetailReport from './pages/UserDetailReport'
import { LogoutPage } from './pages/Logout'

// Training Zone
import TrainingZone from './pages/TrainingZone'
import WODsRepository from './pages/training-zone/WODsRepository'
import WODEditor from './pages/training-zone/WODEditor'
import WODBuilder from './pages/training-zone/WODBuilder'

// Content Management
import ContentManagement from './pages/content/ContentManagement'
import ArticlesManagement from './pages/content/ArticlesManagement'
import ArticleEditor from './pages/content/ArticleEditor'

// Content Repositories
import { AIAgentsRepository } from './pages/content/AIAgentsRepository'
import { VideosRepository } from './pages/content/VideosRepository'
import { DocumentsRepository } from './pages/content/DocumentsRepository'
import { ImagesRepository } from './pages/content/ImagesRepository'
import { PDFsRepository } from './pages/content/PDFsRepository'
import { PromptsRepository } from './pages/content/PromptsRepository'
import { AutomationsRepository } from './pages/content/AutomationsRepository'

// Content Editors
import { AIAgentEditor } from './pages/content/AIAgentEditor'
import { VideoEditor } from './pages/content/VideoEditor'
import { DocumentEditor } from './pages/content/DocumentEditor'
import { ImageEditor } from './pages/content/ImageEditor'
import { PDFEditor } from './pages/content/PDFEditor'
import { PromptEditor } from './pages/content/PromptEditor'
import { AutomationEditor } from './pages/content/AutomationEditor'

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log application-level errors for monitoring
        console.group('🚨 Application Error');
        console.error('App-level error:', error);
        console.error('Error info:', errorInfo);
        console.groupEnd();
        
        // Report to error tracking service in production
        if (process.env.NODE_ENV === 'production') {
          // Add error reporting service here (e.g., Sentry)
          console.warn('Production error reporting not configured');
        }
      }}
    >
      <AuthProvider>
        <Router>
          <div className="App">
            <ErrorBoundary>
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <ProtectedRoute requireAdmin>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <ProtectedRoute requireAdmin>
                <Dashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/communities" element={
              <ProtectedRoute requireAdmin>
                <Communities />
              </ProtectedRoute>
            } />

            <Route path="/communities/:communityId" element={
              <ProtectedRoute requireAdmin>
                <CommunityConfig />
              </ProtectedRoute>
            } />
            
            <Route path="/users/:userId" element={
              <ProtectedRoute requireAdmin>
                <UserDetailReport />
              </ProtectedRoute>
            } />
            
            <Route path="/users" element={
              <ProtectedRoute requireAdmin>
                <UsersPage />
              </ProtectedRoute>
            } />
            
            <Route path="/tags" element={
              <ProtectedRoute requireAdmin>
                <Tags />
              </ProtectedRoute>
            } />
            
            {/* Training Zone Routes */}
            <Route path="/training-zone" element={
              <ProtectedRoute requireAdmin>
                <TrainingZone />
              </ProtectedRoute>
            } />
            
            <Route path="/training-zone/wods" element={
              <ProtectedRoute requireAdmin>
                <WODsRepository />
              </ProtectedRoute>
            } />
            
            <Route path="/training-zone/wods/create" element={
              <ProtectedRoute requireAdmin>
                <WODEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/training-zone/wods/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <WODEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/training-zone/wods/builder" element={
              <ProtectedRoute requireAdmin>
                <WODBuilder />
              </ProtectedRoute>
            } />
            
            <Route path="/training-zone/wods/:id/builder" element={
              <ProtectedRoute requireAdmin>
                <WODBuilder />
              </ProtectedRoute>
            } />
            
            {/* Content Management Routes */}
            <Route path="/content" element={
              <ProtectedRoute requireAdmin>
                <ContentManagement />
              </ProtectedRoute>
            } />
            
            {/* Content Repository Routes */}
            <Route path="/content/articles" element={
              <ProtectedRoute requireAdmin>
                <ArticlesManagement />
              </ProtectedRoute>
            } />
            
            <Route path="/content/ai-agents" element={
              <ProtectedRoute requireAdmin>
                <AIAgentsRepository />
              </ProtectedRoute>
            } />
            
            <Route path="/content/videos" element={
              <ProtectedRoute requireAdmin>
                <VideosRepository />
              </ProtectedRoute>
            } />
            
            <Route path="/content/documents" element={
              <ProtectedRoute requireAdmin>
                <DocumentsRepository />
              </ProtectedRoute>
            } />
            
            <Route path="/content/images" element={
              <ProtectedRoute requireAdmin>
                <ImagesRepository />
              </ProtectedRoute>
            } />
            
            <Route path="/content/pdfs" element={
              <ProtectedRoute requireAdmin>
                <PDFsRepository />
              </ProtectedRoute>
            } />
            
            <Route path="/content/prompts" element={
              <ProtectedRoute requireAdmin>
                <PromptsRepository />
              </ProtectedRoute>
            } />
            
            <Route path="/content/automations" element={
              <ProtectedRoute requireAdmin>
                <AutomationsRepository />
              </ProtectedRoute>
            } />
            
            {/* Content Editor Routes */}
            <Route path="/content/articles/create" element={
              <ProtectedRoute requireAdmin>
                <ArticleEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/articles/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <ArticleEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/ai-agents/create" element={
              <ProtectedRoute requireAdmin>
                <AIAgentEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/ai-agents/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <AIAgentEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/videos/create" element={
              <ProtectedRoute requireAdmin>
                <VideoEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/videos/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <VideoEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/documents/create" element={
              <ProtectedRoute requireAdmin>
                <DocumentEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/documents/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <DocumentEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/images/create" element={
              <ProtectedRoute requireAdmin>
                <ImageEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/images/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <ImageEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/pdfs/create" element={
              <ProtectedRoute requireAdmin>
                <PDFEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/pdfs/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <PDFEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/prompts/create" element={
              <ProtectedRoute requireAdmin>
                <PromptEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/prompts/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <PromptEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/automations/create" element={
              <ProtectedRoute requireAdmin>
                <AutomationEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/content/automations/:id/edit" element={
              <ProtectedRoute requireAdmin>
                <AutomationEditor />
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute requireAdmin>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
                    <p className="text-gray-600">Settings page coming soon...</p>
                  </div>
                </div>
              </ProtectedRoute>
            } />
            
            <Route path="/logout" element={
              <ProtectedRoute requireAdmin>
                <LogoutPage />
              </ProtectedRoute>
            } />
            
            {/* Catch all route */}
            <Route path="*" element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h2>
                  <p className="text-gray-600">The page you're looking for doesn't exist.</p>
                </div>
              </div>
            } />
              </Routes>
            </ErrorBoundary>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App