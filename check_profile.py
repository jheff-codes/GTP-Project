import sys, os
sys.path.append('backend')
sys.path.append('backend/shared/python')
from database import supabase

user_id = '06ba6337-7907-430d-81a4-8695a1e6f2e2'
resp = supabase.table('profiles').select('id,agency_id,email,role').eq('id', user_id).single().execute()
print(resp)
