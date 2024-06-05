# 跳转后 nop，避免默认的预执行
# sp -> 栈指针

addiu $sp, $0, 0x10010080 # 给 sp 设置个初始位置

addiu $s0, $0, 5 # s0 赋值为 5
sw $s0, 0($sp) # 将 s0 的值写入 sp 中
addiu $sp, $sp, -4 # 将栈指针 sp++，俗称压栈

jal FACT # 当使用 jal 后，会将 当前位置 + 4（也就是第 11 行） 存到 ra 中
nop
j END # 避免函数跳转回来后继续执行
nop

FACT:
sw $ra, 0($sp) # 为了在函数执行完后退出，将 ra（也就是函数执行时所在的位置） 的值写入 sp 中
addiu $sp, $sp, -4 # 压栈

lw $s0, 8($sp) # 读取入参(s0)

sw $0, 0($sp) # 将 0 写入 sp（返回值：因为这里没有返回值，用 0 占位）
addiu $sp, $sp, -4 # 压栈

bne $s0, $0, RECURSION # 入参(s0)不为 0 时，跳转到 RECURSION
nop

lw $t1, 8($sp) # 将 ra 写入 t1 中，因为 ra 是个特殊的寄存器，所以不建议直接使用

addiu $sp, $sp, 8 # 出栈：返回地址、返回值；没有子函数参数

addiu $s0, $0, 1 # 入参为 0，则返回 1 给父函数
sw $s0, 0($sp) # 将 s0 的值写入 sp 中
addiu $sp, $sp, -4 # 压栈

jr $t1 # 退出函数
nop

RECURSION:
addiu $s1, $s0, -1 # 将入参(s0) - 1，写入 s1
sw $s1, 0($sp) # 将 s1 的值写入 sp 中
addiu $sp, $sp, -4 # 压栈

jal FACT # 递归
nop

# 函数调用栈：参数(参数由父函数释放) -> 返回地址 -> 返回值 -> 子函数的参数 -> 子函数的返回值
lw $s0, 20($sp) # 将参数写入 s0 中
lw $s1, 4($sp) # 将子函数的返回值写入 s1 中
lw $t1, 16($sp) # 将返回地址写入 t1 中

mult $s1, $s0 # 相乘得到的结果可能会超过 32 位，所以结果会存在 hi（高位）和 lo（低位） 两个寄存器中
mflo $s2 # 将 lo 中的值写入 s2 中

addiu $sp, $sp, 16 # 出栈：返回地址、返回值、子函数的参数、子函数的返回值

sw $s2, 0($sp) # 将 s2 的值写入 sp 中
addiu $sp, $sp, -4 # 压栈

jr $t1 # 退出函数
nop

END:
