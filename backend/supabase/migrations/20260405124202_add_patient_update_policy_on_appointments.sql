create policy "Patient can cancel own appointment"
on appointments
for update
using (auth.uid() = patient_id AND status = 'scheduled')
with check (auth.uid() = patient_id AND status = 'cancelled');