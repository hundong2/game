package com.game.zombieshooter.util

import kotlin.math.sqrt

/**
 * Kotlin 확장 함수 모음
 * 
 * 확장 함수란? 기존 클래스에 새로운 함수를 추가하는 Kotlin의 기능입니다.
 * 예: Float.distance() - Float 타입에 distance 함수를 추가
 */

/**
 * 두 점 사이의 거리를 계산하는 확장 함수
 * 
 * @param x2 목표 지점의 X 좌표
 * @param y2 목표 지점의 Y 좌표
 * @return 두 점 사이의 거리
 * 
 * 사용 예:
 * val distance = playerX.distance(playerY, zombieX, zombieY)
 */
fun Float.distance(y1: Float, x2: Float, y2: Float): Float {
    val dx = x2 - this  // X 축 거리
    val dy = y2 - y1    // Y 축 거리
    return sqrt(dx * dx + dy * dy)  // 피타고라스 정리: √(x² + y²)
}

/**
 * 값을 특정 범위로 제한하는 확장 함수
 * 
 * @param min 최소값
 * @param max 최대값
 * @return 범위 내로 제한된 값
 * 
 * 사용 예:
 * val hp = currentHP.clamp(0f, 100f)  // HP를 0~100 사이로 제한
 */
fun Float.clamp(min: Float, max: Float): Float {
    return when {
        this < min -> min  // 최소값보다 작으면 최소값 반환
        this > max -> max  // 최대값보다 크면 최대값 반환
        else -> this       // 범위 내면 그대로 반환
    }
}

/**
 * Int 값을 Float로 변환하고 범위 제한하는 확장 함수
 */
fun Int.clamp(min: Int, max: Int): Int {
    return when {
        this < min -> min
        this > max -> max
        else -> this
    }
}

/**
 * 각도를 라디안으로 변환하는 확장 함수
 * 
 * @return 라디안 값
 * 
 * 수학 팁: 1라디안 = 180/π 도
 * 게임에서 회전 계산에 자주 사용됩니다
 */
fun Float.toRadians(): Float = this * (Math.PI.toFloat() / 180f)

/**
 * 라디안을 각도로 변환하는 확장 함수
 */
fun Float.toDegrees(): Float = this * (180f / Math.PI.toFloat())

/**
 * 두 각도 사이의 최단 회전 방향을 계산
 * 
 * @param target 목표 각도
 * @return -180 ~ 180 사이의 각도 차이
 */
fun Float.angleDifference(target: Float): Float {
    var diff = target - this
    // -180 ~ 180 범위로 정규화
    while (diff > 180f) diff -= 360f
    while (diff < -180f) diff += 360f
    return diff
}

/**
 * 리스트가 비어있지 않으면 랜덤 요소를 반환
 */
fun <T> List<T>.randomOrNull(): T? {
    return if (this.isEmpty()) null else this.random()
}
