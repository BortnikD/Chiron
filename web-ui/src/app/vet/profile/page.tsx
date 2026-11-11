'use client';

import { Suspense, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Stethoscope, User as UserIcon } from 'lucide-react';
import { useShellHeader } from '@/components/layout/AppShell';
import { UserProfileCard } from '@/components/profile/UserProfileCard';
import { useVetProfile } from './_hooks/useVetProfile';
import { VetClinicalProfileCard } from './_components/VetClinicalProfileCard';

function VetProfileInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab: 'profile' | 'practice' =
    searchParams.get('tab') === 'practice' ? 'practice' : 'profile';

  useShellHeader({
    crumbGroup: 'Врач',
    crumb: activeTab === 'practice' ? 'Профиль врача' : 'Профиль',
  });

  const setTab = useCallback(
    (tab: 'profile' | 'practice') => {
      const nextParams = new URLSearchParams(searchParams.toString());
      if (tab === 'practice') {
        nextParams.set('tab', 'practice');
      } else {
        nextParams.delete('tab');
      }
      const query = nextParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

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
    uploadOwnPhoto,
    deleteOwnPhoto,
  } = useVetProfile();

  return (
    <div className="scroll-col grow">
      <div className="col" style={{ gap: '8px', maxWidth: '1120px', width: '100%' }}>
        <div className="seg" style={{ alignSelf: 'flex-start' }} role="tablist" aria-label="Разделы профиля">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'profile'}
            className={`seg-item ${activeTab === 'profile' ? 'on' : ''}`}
            onClick={() => setTab('profile')}
          >
            <UserIcon className="ic" />
            Личный профиль
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'practice'}
            className={`seg-item ${activeTab === 'practice' ? 'on' : ''}`}
            onClick={() => setTab('practice')}
          >
            <Stethoscope className="ic" />
            Врачебная практика
          </button>
        </div>

        {activeTab === 'profile' ? (
          <UserProfileCard />
        ) : (
          <>
            {loadError && (
              <div className="alert alert-destructive" role="alert" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="row" style={{ gap: '8px', minWidth: 0 }}>
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
                onUploadPhoto={uploadOwnPhoto}
                onDeletePhoto={deleteOwnPhoto}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function VetProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="scroll-col grow">
          <div className="island p-12 text-center text-xs text-[var(--muted-foreground)]">
            Загрузка профиля...
          </div>
        </div>
      }
    >
      <VetProfileInner />
    </Suspense>
  );
}
