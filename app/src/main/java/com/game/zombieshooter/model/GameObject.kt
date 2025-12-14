package com.game.zombieshooter.model

/**
 * 게임 내 모든 객체의 기본 클래스
 */
abstract class GameObject(var x: Float, var y: Float) {
    var isDead: Boolean = false

    abstract fun update(deltaTime: Float)

    // 간단한 사각형 충돌 감지
    fun collidesWith(other: GameObject, width: Float, height: Float, otherWidth: Float, otherHeight: Float): Boolean {
        if (x < other.x + otherWidth &&
            x + width > other.x &&
            y < other.y + otherHeight &&
            y + height > other.y) {
            return true
        }
        return false
    }
}
