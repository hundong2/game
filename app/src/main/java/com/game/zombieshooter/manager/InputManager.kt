package com.game.zombieshooter.manager

import com.game.zombieshooter.util.Constants
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

/**
 * 사용자 입력을 처리하는 매니저
 * 우측 하단 방향키, 좌측 하단 공격/스킬 버튼 처리
 * Multi-touch support added.
 */
class InputManager {

    // 조이스틱 상태
    var joystickActive = false
    var joystickPointerId = -1 // 터치 포인터 ID 추적
    var joystickAngle = 0.0f // 라디안
    var joystickPower = 0.0f // 0.0 ~ 1.0

    // 버튼 상태
    var isAttackPressed = false
    var isSkillPressed = false
    var isSwapWeaponPressed = false

    // 포인터 ID별로 버튼 매핑 추적 (어떤 포인터가 어떤 버튼을 누르고 있는지)
    private val activePointers = mutableMapOf<Int, String>() // <PointerID, ActionType>

    companion object {
        const val ACTION_JOYSTICK = "JOYSTICK"
        const val ACTION_ATTACK = "ATTACK"
        const val ACTION_SKILL = "SKILL"
        const val ACTION_SWAP = "SWAP"
    }

    // 터치 이벤트 처리 (x, y 좌표)
    fun handleTouchDown(x: Float, y: Float, pointerId: Int) {
        if (checkJoystickArea(x, y)) {
            joystickActive = true
            joystickPointerId = pointerId
            activePointers[pointerId] = ACTION_JOYSTICK
            updateJoystick(x, y)
        } else if (checkButtonArea(x, y, Constants.Control.BTN_ATTACK_X, Constants.Control.BTN_ATTACK_Y)) {
            isAttackPressed = true
            activePointers[pointerId] = ACTION_ATTACK
        } else if (checkButtonArea(x, y, Constants.Control.BTN_SKILL_X, Constants.Control.BTN_SKILL_Y)) {
            isSkillPressed = true
            activePointers[pointerId] = ACTION_SKILL
        } else if (checkButtonArea(x, y, Constants.Control.BTN_WEAPON_SWAP_X, Constants.Control.BTN_WEAPON_SWAP_Y)) {
            isSwapWeaponPressed = true
            activePointers[pointerId] = ACTION_SWAP
        }
    }

    fun handleTouchMove(x: Float, y: Float, pointerId: Int) {
        val action = activePointers[pointerId] ?: return

        if (action == ACTION_JOYSTICK) {
            updateJoystick(x, y)
        }
    }

    fun handleTouchUp(pointerId: Int) {
        val action = activePointers[pointerId] ?: return

        when (action) {
            ACTION_JOYSTICK -> {
                joystickActive = false
                joystickPointerId = -1
                joystickPower = 0f
            }
            ACTION_ATTACK -> isAttackPressed = false
            ACTION_SKILL -> isSkillPressed = false
            ACTION_SWAP -> isSwapWeaponPressed = false
        }

        activePointers.remove(pointerId)
    }

    private fun checkJoystickArea(x: Float, y: Float): Boolean {
        val dx = x - Constants.Control.JOYSTICK_CENTER_X
        val dy = y - Constants.Control.JOYSTICK_CENTER_Y
        return sqrt(dx * dx + dy * dy) < Constants.Control.JOYSTICK_RADIUS * 1.5
    }

    private fun checkButtonArea(touchX: Float, touchY: Float, btnX: Float, btnY: Float): Boolean {
        val dx = touchX - btnX
        val dy = touchY - btnY
        return sqrt(dx * dx + dy * dy) < Constants.Control.BTN_RADIUS
    }

    private fun updateJoystick(x: Float, y: Float) {
        val dx = x - Constants.Control.JOYSTICK_CENTER_X
        val dy = y - Constants.Control.JOYSTICK_CENTER_Y

        joystickAngle = atan2(dy, dx)
        val dist = sqrt(dx * dx + dy * dy)
        joystickPower = (dist / Constants.Control.JOYSTICK_RADIUS).coerceAtMost(1.0f)
    }

    // 이동 벡터 반환 (x, y)
    fun getMoveVector(): Pair<Float, Float> {
        if (!joystickActive) return Pair(0f, 0f)
        return Pair(
            cos(joystickAngle) * joystickPower,
            sin(joystickAngle) * joystickPower
        )
    }
}
