// remap 函数接受四个参数：值，原始范围的最小值和最大值，目标范围的最小值和最大值
float remap(float value, float minOriginal, float maxOriginal, float minTarget, float maxTarget) {
  // 首先，将输入值在原始范围内进行标准化，即将其映射到 [0, 1] 的范围内
  float normalizedValue = (value - minOriginal) / (maxOriginal - minOriginal);
  // 接下来，将标准化后的值映射到目标范围内
  float remappedValue = minTarget + normalizedValue * (maxTarget - minTarget);
  // 返回映射后的值，并限定在目标值范围中
  float min = minTarget;
  float max = maxTarget;
  if (min > max) {
    float temp = min;
    min = max;
    max = temp;
  }
  return clamp(remappedValue, min, max);
}