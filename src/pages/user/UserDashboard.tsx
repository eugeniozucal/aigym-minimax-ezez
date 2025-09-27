import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { UserLayout } from '../../components/user/UserLayout'
import { CommunityPage } from './CommunityPage'
import { TrainingZonePage } from './TrainingZonePage'
import { UserWODDetail } from '../../components/user/UserWODDetail'
import { UserBLOCKDetail } from '../../components/user/UserBLOCKDetail'

export function UserDashboard() {
  return (
    <UserLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/user/community" replace />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/training-zone" element={<TrainingZonePage />} />
        <Route path="/training-zone/wod/:id" element={<UserWODDetail />} />
        <Route path="/training-zone/block/:id" element={<UserBLOCKDetail />} />
        {/* Default fallback */}
        <Route path="*" element={<Navigate to="/user/community" replace />} />
      </Routes>
    </UserLayout>
  )
}