
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
    CHECK (role = ANY (ARRAY['doctor'::text, 'patient'::text, 'admin'::text]));


CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;


CREATE POLICY "Admins can read all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admins can read all appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update all appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete appointments"
ON public.appointments FOR DELETE
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admins can read all medical records"
ON public.medical_records FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert medical records"
ON public.medical_records FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update medical records"
ON public.medical_records FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete medical records"
ON public.medical_records FOR DELETE
TO authenticated
USING (public.is_admin());



CREATE POLICY "Admins can read all doctors"
ON public.doctors FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert doctor records"
ON public.doctors FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update doctor records"
ON public.doctors FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete doctor records"
ON public.doctors FOR DELETE
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admins can read all patients"
ON public.patients FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert patient records"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update patient records"
ON public.patients FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete patient records"
ON public.patients FOR DELETE
TO authenticated
USING (public.is_admin());


CREATE POLICY "Admins can read all availability"
ON public.availability FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert availability"
ON public.availability FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update availability"
ON public.availability FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete availability"
ON public.availability FOR DELETE
TO authenticated
USING (public.is_admin());


CREATE OR REPLACE FUNCTION public.admin_save_user(
  p_user_id        uuid,
  p_full_name      text,
  p_phone_number   text    DEFAULT NULL,
  p_gender         text    DEFAULT NULL,
  p_role           text    DEFAULT NULL,
  p_dob            date    DEFAULT NULL,
  p_address        text    DEFAULT NULL,
  p_specialization text    DEFAULT NULL,
  p_license_no     text    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
 
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;


  UPDATE public.profiles
  SET
    full_name    = COALESCE(p_full_name, full_name),
    phone_number = COALESCE(p_phone_number, phone_number),
    gender       = COALESCE(p_gender, gender)
  WHERE id = p_user_id;

  
  IF p_role = 'doctor' AND (p_specialization IS NOT NULL OR p_license_no IS NOT NULL) THEN
    UPDATE public.doctors
    SET
      specialization = COALESCE(p_specialization, specialization),
      license_no     = COALESCE(p_license_no, license_no)
    WHERE id = p_user_id;
  END IF;


  IF p_role = 'patient' AND (p_dob IS NOT NULL OR p_address IS NOT NULL) THEN
    UPDATE public.patients
    SET
      dob     = COALESCE(p_dob, dob),
      address = COALESCE(p_address, address)
    WHERE id = p_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_save_user TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_create_appointment(
  p_patient_id  uuid,
  p_doctor_id   uuid,
  p_scheduled_at timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.appointments (patient_id, doctor_id, scheduled_at, status)
  VALUES (p_patient_id, p_doctor_id, p_scheduled_at, 'scheduled')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_create_appointment TO authenticated;



CREATE OR REPLACE FUNCTION public.admin_update_appointment(
  p_appointment_id uuid,
  p_patient_id     uuid,
  p_doctor_id      uuid,
  p_scheduled_at   timestamptz,
  p_status         text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_status NOT IN ('scheduled', 'completed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_status;
  END IF;

  UPDATE public.appointments
  SET
    patient_id   = p_patient_id,
    doctor_id    = p_doctor_id,
    scheduled_at = p_scheduled_at,
    status       = p_status
  WHERE id = p_appointment_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_appointment TO authenticated;


CREATE OR REPLACE FUNCTION public.admin_save_medical_record(
  p_appointment_id uuid,
  p_description    text,
  p_prescription   text    DEFAULT NULL,
  p_vitals         jsonb   DEFAULT NULL,
  p_record_id      integer DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_record_id IS NOT NULL THEN
    UPDATE public.medical_records
    SET
      appointment_id = p_appointment_id,
      description    = p_description,
      prescription   = p_prescription,
      vitals         = p_vitals
    WHERE id = p_record_id;
  ELSE
    INSERT INTO public.medical_records (appointment_id, description, prescription, vitals)
    VALUES (p_appointment_id, p_description, p_prescription, p_vitals);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_save_medical_record TO authenticated;