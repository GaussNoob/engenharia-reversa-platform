format PE64 GUI
entry start

section '.text' code readable executable
start:
    sub rsp, 40
    xor ecx, ecx
    lea rdx, [message]
    lea r8, [caption]
    xor r9d, r9d
    call [MessageBoxW]
    xor ecx, ecx
    call [ExitProcess]

section '.data' data readable writeable
caption du 'Nucleo', 0
message du 'Entenda o software por dentro.', 0
example db 'Erro',0

section '.idata' import data readable writeable
dd RVA kernel_lookup, 0, 0, RVA kernel_name, RVA kernel_iat
dd RVA user_lookup, 0, 0, RVA user_name, RVA user_iat
dd 0,0,0,0,0

kernel_lookup dq RVA exit_name,0
user_lookup dq RVA message_name,0
kernel_iat:
ExitProcess dq RVA exit_name,0
user_iat:
MessageBoxW dq RVA message_name,0
kernel_name db 'KERNEL32.DLL',0
user_name db 'USER32.DLL',0
exit_name dw 0
db 'ExitProcess',0
message_name dw 0
db 'MessageBoxW',0
