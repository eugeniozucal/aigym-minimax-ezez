import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/SimpleAuthContext';
import { QueryProvider } from './lib/providers/QueryProvider';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Communities } from './pages/Communities';
import UsersPage from './pages/Users';
import Tags from './pages/Tags';
import CommunityConfig from './pages/CommunityConfig';
import UserDetailReport from './pages/UserDetailReport';
import { SmartRedirect } from './components/SmartRedirect';
import { LogoutPage } from './pages/Logout';
// Training Zone
import TrainingZoneLayout from './components/layout/TrainingZoneLayout';
import TrainingDashboard from './components/training-zone/Dashboard';
import WodsRepository from './components/training-zone/EnhancedWodsRepository';
import BlocksRepository from './components/training-zone/EnhancedBlocksRepository';
import ProgramsRepository from './components/training-zone/ProgramsRepository';
import WODEditor from './components/training-zone/WODEditor';
import PageBuilder from './components/shared/PageBuilder';
import ProgramBuilder from './components/training-zone/ProgramBuilder';
// Content Management
import ContentManagement from './pages/content/ContentManagement';
import ArticlesManagement from './pages/content/ArticlesManagement';
import ArticleEditor from './pages/content/ArticleEditor';
// Content Repositories
import { AIAgentsRepository } from './pages/content/AIAgentsRepository';
import { VideosRepository } from './pages/content/VideosRepository';
import { DocumentsRepository } from './pages/content/DocumentsRepository';
import { ImagesRepository } from './pages/content/ImagesRepository';
import { PDFsRepository } from './pages/content/PDFsRepository';
import { PromptsRepository } from './pages/content/PromptsRepository';
import { AutomationsRepository } from './pages/content/AutomationsRepository';
// Content Editors
import { AIAgentEditor } from './pages/content/AIAgentEditor';
import { VideoEditor } from './pages/content/VideoEditor';
import { DocumentEditor } from './pages/content/DocumentEditor';
import { ImageEditor } from './pages/content/ImageEditor';
import { PDFEditor } from './pages/content/PDFEditor';
import { PromptEditor } from './pages/content/PromptEditor';
import { AutomationEditor } from './pages/content/AutomationEditor';
function App() {
    return (_jsx(ErrorBoundary, { onError: (error, errorInfo) => {
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
        }, children: _jsx(QueryProvider, { children: _jsx(AuthProvider, { children: _jsx(Router, { children: _jsx("div", { className: "App", children: _jsx(ErrorBoundary, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/", element: _jsx(SmartRedirect, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/communities", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(Communities, {}) }) }), _jsx(Route, { path: "/communities/:communityId", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(CommunityConfig, {}) }) }), _jsx(Route, { path: "/users/:userId", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(UserDetailReport, {}) }) }), _jsx(Route, { path: "/users", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(UsersPage, {}) }) }), _jsx(Route, { path: "/tags", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(Tags, {}) }) }), _jsxs(Route, { path: "/training-zone", element: _jsx(ProtectedRoute, { requireAuth: true, children: _jsx(TrainingZoneLayout, {}) }), children: [_jsx(Route, { index: true, element: _jsx(TrainingDashboard, {}) }), _jsx(Route, { path: "dashboard", element: _jsx(TrainingDashboard, {}) }), _jsx(Route, { path: "wods", element: _jsx(WodsRepository, {}) }), _jsx(Route, { path: "blocks", element: _jsx(BlocksRepository, {}) }), _jsx(Route, { path: "programs", element: _jsx(ProgramsRepository, {}) })] }), _jsx(Route, { path: "/page-builder", element: _jsx(ProtectedRoute, { requireAuth: true, children: _jsx(PageBuilder, {}) }) }), _jsx(Route, { path: "/program-builder", element: _jsx(ProtectedRoute, { requireAuth: true, children: _jsx(ProgramBuilder, {}) }) }), _jsx(Route, { path: "/training-zone/wods/create", element: _jsx(ProtectedRoute, { requireAuth: true, children: _jsx(WODEditor, {}) }) }), _jsx(Route, { path: "/training-zone/wods/:id/edit", element: _jsx(ProtectedRoute, { requireAuth: true, children: _jsx(WODEditor, {}) }) }), _jsx(Route, { path: "/content", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(ContentManagement, {}) }) }), _jsx(Route, { path: "/content/articles", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(ArticlesManagement, {}) }) }), _jsx(Route, { path: "/content/ai-agents", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(AIAgentsRepository, {}) }) }), _jsx(Route, { path: "/content/videos", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(VideosRepository, {}) }) }), _jsx(Route, { path: "/content/documents", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(DocumentsRepository, {}) }) }), _jsx(Route, { path: "/content/images", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(ImagesRepository, {}) }) }), _jsx(Route, { path: "/content/pdfs", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(PDFsRepository, {}) }) }), _jsx(Route, { path: "/content/prompts", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(PromptsRepository, {}) }) }), _jsx(Route, { path: "/content/automations", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(AutomationsRepository, {}) }) }), _jsx(Route, { path: "/content/articles/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(ArticleEditor, {}) }) }), _jsx(Route, { path: "/content/articles/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(ArticleEditor, {}) }) }), _jsx(Route, { path: "/content/ai-agents/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(AIAgentEditor, {}) }) }), _jsx(Route, { path: "/content/ai-agents/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(AIAgentEditor, {}) }) }), _jsx(Route, { path: "/content/videos/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(VideoEditor, {}) }) }), _jsx(Route, { path: "/content/videos/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(VideoEditor, {}) }) }), _jsx(Route, { path: "/content/documents/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(DocumentEditor, {}) }) }), _jsx(Route, { path: "/content/documents/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(DocumentEditor, {}) }) }), _jsx(Route, { path: "/content/images/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(ImageEditor, {}) }) }), _jsx(Route, { path: "/content/images/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(ImageEditor, {}) }) }), _jsx(Route, { path: "/content/pdfs/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(PDFEditor, {}) }) }), _jsx(Route, { path: "/content/pdfs/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(PDFEditor, {}) }) }), _jsx(Route, { path: "/content/prompts/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(PromptEditor, {}) }) }), _jsx(Route, { path: "/content/prompts/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(PromptEditor, {}) }) }), _jsx(Route, { path: "/content/automations/create", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(AutomationEditor, {}) }) }), _jsx(Route, { path: "/content/automations/:id/edit", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx(AutomationEditor, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { requireAdmin: true, children: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Settings" }), _jsx("p", { className: "text-gray-600", children: "Settings page coming soon..." })] }) }) }) }), _jsx(Route, { path: "/logout", element: _jsx(ProtectedRoute, { requireAuth: true, children: _jsx(LogoutPage, {}) }) }), _jsx(Route, { path: "*", element: _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Page Not Found" }), _jsx("p", { className: "text-gray-600", children: "The page you're looking for doesn't exist." })] }) }) })] }) }) }) }) }) }) }));
}
export default App;
