import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))
sys.path.append(os.path.join(os.getcwd(), 'backend', 'shared', 'python'))

from database import supabase

AGENCY_ID_TESTE = 'b94bf633-a3f7-4f68-bdcd-c9c4ac4977f5'

print(f"Procurando configurações para agency_id: {AGENCY_ID_TESTE}")
print("=" * 80)

try:
    # Buscar TODAS as configurações de message_dispatch
    print("\n1. TODAS as configurações de message_dispatch:")
    all_response = supabase.table('automation_settings').select('*').eq('name', 'message_dispatch').execute()
    print(f"   Total encontradas: {len(all_response.data or [])}")
    for config in all_response.data or []:
        print(f"   - Agency: {config.get('agency_id')}, Status: {config.get('automation_status')}")
    
    print("\n" + "=" * 80)
    # Buscar APENAS para o agency_id de teste
    print(f"\n2. Configuração para o agency_id de TESTE:")
    response = supabase.table('automation_settings').select('*').eq('name', 'message_dispatch').eq('agency_id', AGENCY_ID_TESTE).execute()
    
    if response.data and len(response.data) > 0:
        print(f"   ✓ ENCONTRADA! Total: {len(response.data)}")
        for config in response.data:
            print(f"\n   ID Config: {config.get('id')}")
            print(f"   Agency: {config.get('agency_id')}")
            print(f"   Status: {config.get('automation_status')}")
            
            if config.get('metadata') and config['metadata'].get('uazapi_instances'):
                instances = config['metadata']['uazapi_instances']
                print(f"   Instâncias: {len(instances)}")
                for inst in instances:
                    print(f"     - Nome: {inst.get('name')}")
                    print(f"       URL: {inst.get('url')}")
                    print(f"       Tabela: {inst.get('table_name')}")
                    print(f"       Ativa: {inst.get('is_active', True)}")
            else:
                print("   ✗ Sem instâncias configuradas!")
    else:
        print(f"   ✗ NENHUMA configuração encontrada para este agency_id!")
        print(f"   Isso significa que você precisa criar a configuração no admin para este agency_id")
        
except Exception as e:
    print(f'Erro: {e}')
    import traceback
    traceback.print_exc()