ALTER TABLE public.profiles
  ADD COLUMN phone_number text NULL
  CONSTRAINT profiles_phone_number_check
    CHECK (phone_number ~ '^[0-9]{10}$');

DROP POLICY "Doctors can update appointment status" ON public.appointments;

CREATE POLICY "Doctors can update appointment status"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() = doctor_id)
WITH CHECK (
  auth.uid() = doctor_id
  AND status IN ('completed', 'cancelled')
);

DROP POLICY "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view relevant profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.doctor_id = auth.uid()
    AND a.patient_id = id
  )
  OR EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = auth.uid()
    AND a.doctor_id = id
  )
);

DROP POLICY "Doctors view their patients" ON public.patients;

CREATE POLICY "Doctors view their patients"
ON public.patients FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.patient_id = patients.id
    AND a.doctor_id = auth.uid()
    AND a.status != 'cancelled'
  )
);

CREATE POLICY "No direct deletes on medical records"
ON public.medical_records FOR DELETE
TO authenticated
USING (false);

CREATE OR REPLACE FUNCTION public.update_appointment_status(
  appointment_id uuid,
  new_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_status text;
  current_doctor_id uuid;
BEGIN
  SELECT status, doctor_id
  INTO current_status, current_doctor_id
  FROM appointments
  WHERE id = appointment_id;

  IF current_doctor_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF current_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot change a completed appointment';
  END IF;

  IF current_status = 'cancelled' THEN
    RAISE EXCEPTION 'Cannot change a cancelled appointment';
  END IF;

  IF new_status NOT IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', new_status;
  END IF;

  UPDATE appointments
  SET status = new_status
  WHERE id = appointment_id;
END;
$$;

;
