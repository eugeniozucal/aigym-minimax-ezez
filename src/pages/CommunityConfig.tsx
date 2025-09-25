import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Settings, 
  ToggleLeft, 
  Tag, 
  Users, 
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  Link,
  Copy,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCommunitySignup } from '../hooks/useCommunitySignup';

type TabType = 'settings' | 'features' | 'tags' | 'users';

interface Community {
  id: string;
  name: string;
  project_name: string;
  logo_url: string;
  brand_color: string;
  forum_enabled: boolean;
  status: string;
  created_at: string;
  signup_link?: string;
}



const CommunityConfig: React.FC = () => {
  const { communityId } = useParams<{ communityId: string }>();
  const navigate = useNavigate();
  
  const [community, setCommunity] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [saving, setSaving] = useState(false);
  
  // Settings tab state
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    project_name: '',
    brand_color: '',
    forum_enabled: true
  });
  const [settingsChanged, setSettingsChanged] = useState(false);
  
  // Signup link state
  const [signupLink, setSignupLink] = useState<string>('');
  const [signupLinkCopied, setSignupLinkCopied] = useState(false);
  const { generateSignupLink, copyToClipboard, loading: signupLoading, error: signupError } = useCommunitySignup();

  const loadCommunity = useCallback(async () => {
    if (!communityId) return;
    
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', communityId)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Community not found');
      
      setCommunity(data);
      setSettingsForm({
        name: data.name,
        project_name: data.project_name || '',
        brand_color: data.brand_color || '#3B82F6',
        forum_enabled: data.forum_enabled
      });
    } catch (error) {
      console.error('Error loading community:', error);
      navigate('/communities');
    } finally {
      setLoading(false);
    }
  }, [communityId, navigate]);





  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const handleSettingsChange = (field: string, value: any) => {
    setSettingsForm(prev => ({ ...prev, [field]: value }));
    setSettingsChanged(true);
  };

  const saveSettings = async () => {
    if (!community) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('communities')
        .update({
          name: settingsForm.name,
          project_name: settingsForm.project_name || null,
          brand_color: settingsForm.brand_color,
          forum_enabled: settingsForm.forum_enabled
        })
        .eq('id', community.id);
      
      if (error) throw error;
      
      setCommunity(prev => prev ? { ...prev, ...settingsForm } : null);
      setSettingsChanged(false);
      
      // Show success toast (you can replace with your toast system)
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings');
    } finally {
      setSaving(false);
    }
  };



  const handleGenerateSignupLink = async () => {
    if (!community) return;
    
    const result = await generateSignupLink({ communityId: community.id });
    if (result) {
      setSignupLink(result.signup_link);
      setCommunity(prev => prev ? { ...prev, signup_link: result.signup_link } : null);
    }
  };

  const handleCopySignupLink = async () => {
    if (!signupLink && !community?.signup_link) return;
    
    const linkToCopy = signupLink || community?.signup_link || '';
    const success = await copyToClipboard(linkToCopy);
    
    if (success) {
      setSignupLinkCopied(true);
      setTimeout(() => setSignupLinkCopied(false), 2000);
    }
  };

  // Load existing signup link when community loads
  useEffect(() => {
    if (community?.signup_link) {
      setSignupLink(community.signup_link);
    }
  }, [community]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Community Name *
                </label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={(e) => handleSettingsChange('name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter community name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={settingsForm.project_name}
                  onChange={(e) => handleSettingsChange('project_name', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional project name"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Color
              </label>
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-md border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: settingsForm.brand_color }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = settingsForm.brand_color;
                    input.onchange = (e) => {
                      handleSettingsChange('brand_color', (e.target as HTMLInputElement).value);
                    };
                    input.click();
                  }}
                />
                <input
                  type="text"
                  value={settingsForm.brand_color}
                  onChange={(e) => handleSettingsChange('brand_color', e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  placeholder="#3B82F6"
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settingsForm.forum_enabled}
                  onChange={(e) => handleSettingsChange('forum_enabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable Forum</span>
                  <p className="text-xs text-gray-500">Allow users to participate in community discussions</p>
                </div>
              </label>
            </div>
            
            {/* Community Signup Link Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Community Signup</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shareable Signup Link
                  </label>
                  <p className="text-sm text-gray-600 mb-3">
                    Generate a secure link that allows new users to join your community. Share this link with people you want to invite.
                  </p>
                  
                  {signupError && (
                    <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm text-red-800">{signupError}</p>
                    </div>
                  )}
                  
                  {(signupLink || community?.signup_link) ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={signupLink || community?.signup_link || ''}
                          readOnly
                          className="flex-1 border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm font-mono"
                        />
                        <button
                          onClick={handleCopySignupLink}
                          className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                            signupLinkCopied
                              ? 'bg-green-50 border-green-200 text-green-800'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          title="Copy to clipboard"
                        >
                          {signupLinkCopied ? (
                            <>
                              <CheckCircle size={16} className="mr-1" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy size={16} className="mr-1" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => window.open(signupLink || community?.signup_link || '', '_blank')}
                          className="px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                          title="Test signup link"
                        >
                          <ExternalLink size={16} className="mr-1" />
                          Test
                        </button>
                      </div>
                      
                      <button
                        onClick={handleGenerateSignupLink}
                        disabled={signupLoading}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                      >
                        {signupLoading ? 'Generating...' : 'Generate New Link'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGenerateSignupLink}
                      disabled={signupLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {signupLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Link size={16} />
                          <span>Generate Signup Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <div className="flex">
                    <AlertTriangle size={16} className="text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Security Note:</p>
                      <p>This link allows anyone with access to join your community. Only share it with trusted individuals.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={saveSettings}
                disabled={!settingsChanged || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <Save size={16} />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <ToggleLeft size={48} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Enabled Features Coming Soon</h3>
              <p className="text-blue-700 mb-4">
                This tab will provide comprehensive feature management for your community.
              </p>
              <p className="text-sm text-blue-600">
                Features will include: Platform feature toggles, custom integrations, and advanced configurations.
              </p>
            </div>
          </div>
        );

      case 'tags':
        return (
          <div className="space-y-6">
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <Tag size={48} className="text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-purple-900 mb-2">Tag Management Coming Soon</h3>
              <p className="text-purple-700 mb-4">
                This tab will provide comprehensive tag management for organizing your community members.
              </p>
              <p className="text-sm text-purple-600">
                Features will include: Custom tags creation, color coding, bulk tagging, and user categorization.
              </p>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <Users size={48} className="text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-green-900 mb-2">User Management Coming Soon</h3>
              <p className="text-green-700 mb-4">
                This tab will provide comprehensive user management for your community members.
              </p>
              <p className="text-sm text-green-600">
                Features will include: User profiles, activity tracking, role assignment, and bulk operations.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Community not found</h2>
        <button
          onClick={() => navigate('/communities')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          Back to Communities
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/communities')}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              
              <div className="flex items-center space-x-4">
                {community.logo_url ? (
                  <img
                    src={community.logo_url}
                    alt={community.name}
                    className="w-12 h-12 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold"
                    style={{ backgroundColor: community.brand_color }}
                  >
                    {community.name.charAt(0).toUpperCase()}
                  </div>
                )}
                
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{community.name}</h1>
                  {community.project_name && (
                    <p className="text-gray-600">{community.project_name}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'settings', label: 'Settings', icon: Settings },
              { id: 'features', label: 'Enabled Features', icon: ToggleLeft },
              { id: 'tags', label: 'Tag Management', icon: Tag },
              { id: 'users', label: 'User Management', icon: Users }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center space-x-2 px-1 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default CommunityConfig;