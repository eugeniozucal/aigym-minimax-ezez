import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/BulletproofAuthContext'
import { CommunityProvider } from './contexts/CommunityContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BulletproofProtectedRoute, AdminRoute, CommunityRoute, PublicRoute } from './components/BulletproofProtectedRoute'
import { AuthMiddleware } from './components/AuthMiddleware'
import { SmartRedirect } from './components/SmartRedirect'
import { Login } from './pages/Login'
import { AdminLogin } from './pages/AdminLogin'
import { CommunityLogin } from './pages/CommunityLogin'
import { UserRoleManagement } from './pages/admin/UserRoleManagement'
import { Dashboard } from './pages/Dashboard'
import { SimpleDashboard } from './pages/SimpleDashboard'
import { Communities } from './pages/Communities'
import UsersPage from './pages/Users'
import Tags from './pages/Tags'
import CommunityConfig from './pages/CommunityConfig'
import UserDetailReport from './pages/UserDetailReport'
import { CommunitySignup } from './pages/CommunitySignup'
import { LogoutPage } from './pages/Logout'
import { UserDashboard } from './pages/user/UserDashboard'
import { TrainingZoneLayout } from './components/layout/TrainingZoneLayout'
import { Dashboard as TrainingZoneDashboard } from './components/training-zone/Dashboard'
import { WodsRepository } from './components/training-zone/WodsRepository'
import { BlocksRepository } from './components/training-zone/BlocksRepository'
import { ProgramsRepository } from './components/training-zone/ProgramsRepository'
import { AdminProgramsGallery } from './components/training-zone/AdminProgramsGallery'
import { ProgramConfiguration } from './pages/admin/ProgramConfiguration'
import { ProgramBuilder } from './components/training-zone/ProgramBuilder'
import { WODEditor } from './components/training-zone/WODEditor'
import { PageBuilder } from './components/shared/PageBuilder'

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
        <CommunityProvider>
          <Router>
          <div className="App">
            <ErrorBoundary>
              <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/community/login" element={<CommunityLogin />} />
            
            {/* Protected Routes */}
            <Route path="/" element={
              <BulletproofProtectedRoute>
                <SmartRedirect />
              </BulletproofProtectedRoute>
            } />
            
            <Route path="/dashboard" element={
              <AdminRoute>
                <SimpleDashboard />
              </AdminRoute>
            } />
            
            <Route path="/admin/dashboard" element={
              <AdminRoute>
                <SimpleDashboard />
              </AdminRoute>
            } />
            

            <Route path="/communities" element={
              <AdminRoute>
                <Communities />
              </AdminRoute>
            } />

            <Route path="/communities/:communityId/configure" element={
              <AdminRoute>
                <CommunityConfig />
              </AdminRoute>
            } />
            
            {/* Public Community Signup Route */}
            <Route path="/signup" element={
              <PublicRoute>
                <CommunitySignup />
              </PublicRoute>
            } />
            
            <Route path="/users/:userId" element={
              <AdminRoute>
                <UserDetailReport />
              </AdminRoute>
            } />
            
            <Route path="/users" element={
              <AdminRoute>
                <UsersPage />
              </AdminRoute>
            } />
            
            <Route path="/tags" element={
              <AdminRoute>
                <Tags />
              </AdminRoute>
            } />
            
            {/* Admin Programs Routes */}
            <Route path="/admin/programs" element={
              <AdminRoute>
                <AdminProgramsGallery />
              </AdminRoute>
            } />
            
            <Route path="/admin/programs/:programId" element={
              <AdminRoute>
                <ProgramConfiguration />
              </AdminRoute>
            } />
            
            {/* Training Zone Routes */}
            <Route path="/training-zone" element={
              <AdminRoute>
                <TrainingZoneLayout />
              </AdminRoute>
            }>
              <Route index element={<TrainingZoneDashboard />} />
              <Route path="dashboard" element={<TrainingZoneDashboard />} />
              <Route path="wods" element={<WodsRepository />} />
              <Route path="wods/:id/edit" element={<WODEditor />} />
              <Route path="blocks" element={<BlocksRepository />} />
              <Route path="programs" element={<AdminProgramsGallery />} />
            </Route>
            
            <Route path="/program-builder" element={
              <AdminRoute>
                <ProgramBuilder />
              </AdminRoute>
            } />
            
            <Route path="/page-builder" element={
              <AdminRoute>
                <PageBuilder />
              </AdminRoute>
            } />
            
            {/* Content Management Routes */}
            <Route path="/content" element={
              <AdminRoute>
                <ContentManagement />
              </AdminRoute>
            } />
            
            {/* Content Repository Routes */}
            <Route path="/content/articles" element={
              <AdminRoute>
                <ArticlesManagement />
              </AdminRoute>
            } />
            
            <Route path="/content/ai-agents" element={
              <AdminRoute>
                <AIAgentsRepository />
              </AdminRoute>
            } />
            
            <Route path="/content/videos" element={
              <AdminRoute>
                <VideosRepository />
              </AdminRoute>
            } />
            
            <Route path="/content/documents" element={
              <AdminRoute>
                <DocumentsRepository />
              </AdminRoute>
            } />
            
            <Route path="/content/images" element={
              <AdminRoute>
                <ImagesRepository />
              </AdminRoute>
            } />
            
            <Route path="/content/pdfs" element={
              <AdminRoute>
                <PDFsRepository />
              </AdminRoute>
            } />
            
            <Route path="/content/prompts" element={
              <AdminRoute>
                <PromptsRepository />
              </AdminRoute>
            } />
            
            <Route path="/content/automations" element={
              <AdminRoute>
                <AutomationsRepository />
              </AdminRoute>
            } />
            
            {/* Content Editor Routes */}
            <Route path="/content/articles/create" element={
              <AdminRoute>
                <ArticleEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/articles/:id/edit" element={
              <AdminRoute>
                <ArticleEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/ai-agents/create" element={
              <AdminRoute>
                <AIAgentEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/ai-agents/:id/edit" element={
              <AdminRoute>
                <AIAgentEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/videos/create" element={
              <AdminRoute>
                <VideoEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/videos/:id/edit" element={
              <AdminRoute>
                <VideoEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/documents/create" element={
              <AdminRoute>
                <DocumentEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/documents/:id/edit" element={
              <AdminRoute>
                <DocumentEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/images/create" element={
              <AdminRoute>
                <ImageEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/images/:id/edit" element={
              <AdminRoute>
                <ImageEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/pdfs/create" element={
              <AdminRoute>
                <PDFEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/pdfs/:id/edit" element={
              <AdminRoute>
                <PDFEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/prompts/create" element={
              <AdminRoute>
                <PromptEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/prompts/:id/edit" element={
              <AdminRoute>
                <PromptEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/automations/create" element={
              <AdminRoute>
                <AutomationEditor />
              </AdminRoute>
            } />
            
            <Route path="/content/automations/:id/edit" element={
              <AdminRoute>
                <AutomationEditor />
              </AdminRoute>
            } />
            
            <Route path="/settings" element={
              <AdminRoute>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
                    <p className="text-gray-600">Settings page coming soon...</p>
                  </div>
                </div>
              </AdminRoute>
            } />
            
            <Route path="/logout" element={
              <AdminRoute>
                <LogoutPage />
              </AdminRoute>
            } />
            
            {/* Community User Routes */}
            <Route path="/user/*" element={
              <CommunityRoute>
                <UserDashboard />
              </CommunityRoute>
            } />
            
            <Route path="/community/*" element={
              <CommunityRoute>
                <UserDashboard />
              </CommunityRoute>
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
        </CommunityProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App