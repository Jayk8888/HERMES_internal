CREATE OR REPLACE FUNCTION public.book_appointment(
  p_doctor_id uuid,
  p_scheduled_at timestamp with time zone
)
RETURNS public.appointments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_patient_id uuid := auth.uid();
  v_appointment public.appointments;
BEGIN
  IF v_patient_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_doctor_id IS NULL OR p_scheduled_at IS NULL THEN
    RAISE EXCEPTION 'Doctor and appointment time are required';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.patients
    WHERE id = v_patient_id
  ) THEN
    RAISE EXCEPTION 'Complete your patient profile before booking an appointment';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.doctors
    WHERE id = p_doctor_id
  ) THEN
    RAISE EXCEPTION 'Selected doctor was not found';
  END IF;

  IF p_scheduled_at <= now() THEN
    RAISE EXCEPTION 'Appointments must be scheduled in the future';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
      AND scheduled_at = p_scheduled_at
      AND status = 'scheduled'
  ) THEN
    RAISE EXCEPTION 'This appointment slot is no longer available';
  END IF;

  INSERT INTO public.appointments (
    patient_id,
    doctor_id,
    scheduled_at,
    status
  )
  VALUES (
    v_patient_id,
    p_doctor_id,
    p_scheduled_at,
    'scheduled'
  )
  RETURNING * INTO v_appointment;

  RETURN v_appointment;
END;
$$;

GRANT EXECUTE ON FUNCTION public.book_appointment(uuid, timestamp with time zone) TO authenticated;
