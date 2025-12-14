package com.game.zombieshooter.model.hero

import com.game.zombieshooter.model.weapon.Weapon
import com.game.zombieshooter.util.Constants

class YiSunSin(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_YI_SUN_SIN,
    maxHp = 120, // 중상
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 1.0f // 중
) {
    override fun useSkill(): Boolean {
        // 거북선 포격 지원
        // 실제 구현에서는 Projectile을 생성하여 GameEngine에 등록해야 함
        return true
    }
}

class YiSeongGye(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_YI_SEONG_GYE,
    maxHp = 80, // 하
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 1.2f // 상
) {
    override fun useSkill(): Boolean {
        // 편전 연사
        return true
    }
}

class CheokSaGwang(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_CHEOK_SA_GWANG,
    maxHp = 90, // 하
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 1.3f // 최상
) {
    override fun useSkill(): Boolean {
        // 검무
        return true
    }
}

class WangGeon(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_WANG_GEON,
    maxHp = 110,
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 1.0f
) {
    override fun useSkill(): Boolean {
        return true
    }
}

class GungYe(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_GUNG_YE,
    maxHp = 70, // 최하
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 0.9f // 하
) {
    override fun useSkill(): Boolean {
        // 관심법
        return true
    }
}

class Dangun(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_DANGUN,
    maxHp = 100,
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 1.0f
) {
    override fun useSkill(): Boolean {
        // 홍익인간
        return true
    }
}

class Gwanggaeto(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_GWANGGAETO,
    maxHp = 130, // 상
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 0.9f // 하
) {
    override fun useSkill(): Boolean {
        // 대륙의 기상
        return true
    }
}

class Jangsu(startX: Float, startY: Float) : Hero(
    startX, startY,
    Constants.HeroStats.HERO_JANGSU,
    maxHp = 150, // 최상
    speed = Constants.HeroStats.BASE_MOVE_SPEED * 0.7f // 최하
) {
    override fun useSkill(): Boolean {
        // 철벽 방어
        return true
    }
}
