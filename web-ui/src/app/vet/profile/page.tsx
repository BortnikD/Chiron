'use client';

import { useState } from 'react';
import { AlertCircle, Stethoscope, User as UserIcon } from 'lucide-react';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { useVetProfile } from './_hooks/useVetProfile';
import { VetClinicalProfileCard } from './_components/VetClinicalProfileCard';

export default function VetProfilePage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'practice'>('profile');
  const {
    vetProfile,
    specsMap,
    form,
    setForm,
    loading,
    loadError,
    reload,
    saving,
    success,
    error,
    handleSubmit,
  } = useVetProfile();

  return (
    <div className="scroll-col grow">
      <div className="flex flex-col gap-2 max-w-[1120px] w-full">
        <div className="seg self-start" role="tablist" aria-label="Разделы профиля">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            className={`seg-item ${activeTab === 'profile' ? 'on font-semibold' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <UserIcon className="ic" style={{ width: '15px', height: '15px' }} />
            <span>Личный профиль</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'practice'}
            className={`seg-item ${activeTab === 'practice' ? 'on font-semibold' : ''}`}
            onClick={() => setActiveTab('practice')}
          >
            <Stethoscope className="ic" style={{ width: '15px', height: '15px' }} />
            <span>Врачебная практика</span>
          </button>
        </div>

        {activeTab === 'profile' ? (
          <UserProfileCard />
        ) : (
          <>
            {loadError && (
              <div className="alert alert-destructive items-center justify-between" role="alert">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertCircle className="ic" style={{ marginTop: 0 }} />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={reload}
                  disabled={loading}
                >
                  Повторить
                </button>
              </div>
            )}

            {(!loadError || vetProfile || loading) && (
              <VetClinicalProfileCard
                vetProfile={vetProfile}
                specsMap={specsMap}
                form={form}
                loading={loading}
                saving={saving}
                success={success}
                error={error}
                onChange={setForm}
                onSubmit={handleSubmit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
