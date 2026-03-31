DROP POLICY "No direct inserts on doctors" ON public.doctors;

CREATE POLICY "Doctors can insert own record"
ON public.doctors FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
