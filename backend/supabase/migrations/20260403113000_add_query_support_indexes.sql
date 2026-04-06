CREATE INDEX IF NOT EXISTS appointments_patient_id_scheduled_at_idx
ON public.appointments USING btree (patient_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS appointments_patient_id_status_scheduled_at_idx
ON public.appointments USING btree (patient_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS appointments_doctor_id_scheduled_at_idx
ON public.appointments USING btree (doctor_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS appointments_doctor_id_status_scheduled_at_idx
ON public.appointments USING btree (doctor_id, status, scheduled_at);

CREATE INDEX IF NOT EXISTS appointments_doctor_id_patient_id_scheduled_at_idx
ON public.appointments USING btree (doctor_id, patient_id, scheduled_at DESC);

CREATE INDEX IF NOT EXISTS medical_records_created_at_idx
ON public.medical_records USING btree (created_at DESC);
