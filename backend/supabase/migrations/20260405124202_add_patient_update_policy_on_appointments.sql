create policy "Patient can cancel own appointment"
on appointments
for update
using (auth.uid() = patient_id);