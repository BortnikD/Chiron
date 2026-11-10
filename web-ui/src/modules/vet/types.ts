export interface CreateFollowUpRequest {
  serviceId?: string;
  startAt: string;
  endAt: string;
}

export interface UpdateVetProfileRequest {
  bio?: string | null;
  photoUrl?: string | null;
  experienceYears?: number;
}
