DROP POLICY IF EXISTS "Patient can cancel own appointment" ON public.appointments;
DROP POLICY IF EXISTS "Patients can cancel own appointments" ON public.appointments;

CREATE POLICY "Patients can cancel own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (
  auth.uid() = patient_id
  AND status = 'scheduled'
)
WITH CHECK (
  auth.uid() = patient_id
  AND status = 'cancelled'
);
);

REVOKE UPDATE ON public.appointments FROM authenticated;
GRANT UPDATE (status) ON public.appointments TO authenticated;
