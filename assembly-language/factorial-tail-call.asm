# 跳转后 nop，避免默认的预执行
# sp -> 栈指针

addiu $sp, $0, 0x10010080 # 给 sp 设置个初始位置

addiu $s0, $0, 5 # s0 赋值为 5
sw $s0, 0($sp) # 将 s0 的值写入 sp 中
addiu $sp, $sp, -4 # 将栈指针 sp++，俗称压栈

addiu $s1, $0, 1 # total = 1
sw $s1, 0($sp)
addiu $sp, $sp, -4

jal FACT # 当使用 jal 后，会将 当前位置 + 4（也就是第 11 行） 存到 ra 中
nop

FACT:
mult $s0, $s1
mflo $s1

sw $s1 4($sp)

addiu $s0, $s0, -1

bne $s0, 1, FACT # 入参(s0)不为 1 时，跳出 RECURSION
nop

addiu $sp, $sp, 8 # 出栈

END:
