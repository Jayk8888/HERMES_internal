
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    'patient'
  );
  RETURN NEW;
END;
$$;
 

CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);
 
DROP POLICY IF EXISTS "Users can update name but not role" ON public.profiles;
CREATE POLICY "Users can update name but not role"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
 
CREATE POLICY "No direct inserts on profiles"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (false);
 
CREATE POLICY "No direct deletes on profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (false);
 

CREATE POLICY "Patients view own record"
ON public.patients FOR SELECT
TO authenticated
USING (auth.uid() = id);
 
CREATE POLICY "Doctors view their patients"
ON public.patients FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.patient_id = patients.id
      AND a.doctor_id = auth.uid()
  )
);
 
CREATE POLICY "Patients update own record"
ON public.patients FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
 
CREATE POLICY "No direct inserts on patients"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (false);
 
CREATE POLICY "No direct deletes on patients"
ON public.patients FOR DELETE
TO authenticated
USING (false);
 

CREATE POLICY "Authenticated users can view doctors"
ON public.doctors FOR SELECT
TO authenticated
USING (true);
 
CREATE POLICY "Doctors update own record"
ON public.doctors FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
 
CREATE POLICY "No direct inserts on doctors"
ON public.doctors FOR INSERT
TO authenticated
WITH CHECK (false);
 
CREATE POLICY "No direct deletes on doctors"
ON public.doctors FOR DELETE
TO authenticated
USING (false);
 
CREATE POLICY "Doctors can create medical records"
ON public.medical_records FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = medical_records.appointment_id
      AND a.doctor_id = auth.uid()
      AND a.status = 'completed'
  )
);
 
CREATE POLICY "Doctors can update own medical records"
ON public.medical_records FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = medical_records.appointment_id
      AND a.doctor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = medical_records.appointment_id
      AND a.doctor_id = auth.uid()
  )
);
 

DROP POLICY IF EXISTS "Doctors can view full history of their patients" ON public.medical_records;
CREATE POLICY "Doctors view records from own appointments"
ON public.medical_records FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = medical_records.appointment_id
      AND a.doctor_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Patients view own records" ON public.medical_records;
CREATE POLICY "Patients view own records"
ON public.medical_records FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.appointments
    WHERE appointments.id = medical_records.appointment_id
      AND appointments.patient_id = auth.uid()
  )
);
 
DROP POLICY IF EXISTS "Doctors view assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Patients view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can see their own appointments" ON public.appointments;
 
CREATE POLICY "Users view own appointments"
ON public.appointments FOR SELECT
TO authenticated
USING (auth.uid() = patient_id OR auth.uid() = doctor_id);
 

DROP POLICY IF EXISTS "Patients can book appointments" ON public.appointments;
CREATE POLICY "Patients can book appointments"
ON public.appointments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = patient_id);
 

CREATE POLICY "Doctors can update appointment status"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);
 

CREATE POLICY "Patients can cancel own appointments"
ON public.appointments FOR UPDATE
TO authenticated
USING (auth.uid() = patient_id)
WITH CHECK (
  auth.uid() = patient_id
  AND status = 'cancelled'
);

ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
 
DROP POLICY IF EXISTS "Doctors manage own availability" ON public.availability;
CREATE POLICY "Doctors manage own availability"
ON public.availability FOR ALL
TO authenticated
USING (auth.uid() = doctor_id)
WITH CHECK (auth.uid() = doctor_id);
 

DROP POLICY IF EXISTS "Anyone can view availability" ON public.availability;
CREATE POLICY "Anyone can view availability"
ON public.availability FOR SELECT
TO public
USING (true);
