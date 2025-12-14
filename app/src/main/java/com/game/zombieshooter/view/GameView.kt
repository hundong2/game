package com.game.zombieshooter.view

import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.view.MotionEvent
import android.view.SurfaceHolder
import android.view.SurfaceView
import com.game.zombieshooter.engine.GameEngine
import com.game.zombieshooter.model.hero.YiSunSin
import com.game.zombieshooter.model.weapon.Sword
import com.game.zombieshooter.util.Constants

class GameView(context: Context) : SurfaceView(context), SurfaceHolder.Callback, GameEngine.GameLoopListener {

    private val gameEngine = GameEngine()
    private val paint = Paint()

    init {
        holder.addCallback(this)

        // 초기화: 이순신 장군 + 쌍룡검
        val hero = YiSunSin(Constants.GAME_WIDTH / 2f, Constants.GAME_HEIGHT / 2f)
        hero.weapon = Sword()
        gameEngine.setHero(hero)
        gameEngine.setListener(this)
    }

    override fun surfaceCreated(holder: SurfaceHolder) {
        gameEngine.start()
    }

    override fun surfaceChanged(holder: SurfaceHolder, format: Int, width: Int, height: Int) {
        // 화면 크기 변경 대응
    }

    override fun surfaceDestroyed(holder: SurfaceHolder) {
        gameEngine.stop()
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val action = event.actionMasked
        val index = event.actionIndex
        val id = event.getPointerId(index)
        val x = event.getX(index)
        val y = event.getY(index)

        when (action) {
            MotionEvent.ACTION_DOWN, MotionEvent.ACTION_POINTER_DOWN -> {
                gameEngine.inputManager.handleTouchDown(x, y, id)
            }
            MotionEvent.ACTION_MOVE -> {
                // Move는 모든 포인터에 대해 발생할 수 있음
                for (i in 0 until event.pointerCount) {
                    val pid = event.getPointerId(i)
                    val px = event.getX(i)
                    val py = event.getY(i)
                    gameEngine.inputManager.handleTouchMove(px, py, pid)
                }
            }
            MotionEvent.ACTION_UP, MotionEvent.ACTION_POINTER_UP -> {
                gameEngine.inputManager.handleTouchUp(id)
            }
            MotionEvent.ACTION_CANCEL -> {
                gameEngine.inputManager.handleTouchUp(id)
            }
        }
        return true
    }

    override fun onUpdate(deltaTime: Float) {
        // View logic update (Camera, shake, etc)
    }

    override fun onRender() {
        val canvas: Canvas? = holder.lockCanvas()
        if (canvas != null) {
            try {
                drawGame(canvas)
            } synchronized(holder) {
                // drawing
            } finally {
                holder.unlockCanvasAndPost(canvas)
            }
        }
    }

    private fun drawGame(canvas: Canvas) {
        // Clear screen
        canvas.drawColor(Color.BLACK)

        // 1. Draw Player
        paint.color = Color.BLUE
        gameEngine.playerHero?.let { hero ->
            canvas.drawRect(
                hero.x, hero.y,
                hero.x + Constants.HeroStats.HITBOX_WIDTH,
                hero.y + Constants.HeroStats.HITBOX_HEIGHT,
                paint
            )

            // HUD: Player Name
            paint.color = Color.WHITE
            paint.textSize = 30f
            canvas.drawText(hero.name, hero.x, hero.y - 10, paint)
        }

        // 2. Draw Zombies
        paint.color = Color.GREEN
        for (zombie in gameEngine.zombies) {
            canvas.drawRect(
                zombie.x, zombie.y,
                zombie.x + Constants.ZombieStats.ZOMBIE_WIDTH,
                zombie.y + Constants.ZombieStats.ZOMBIE_HEIGHT,
                paint
            )
        }

        // 3. Draw Projectiles
        paint.color = Color.YELLOW
        for (proj in gameEngine.projectiles) {
            canvas.drawCircle(proj.x, proj.y, 10f, paint)
        }

        // 4. Draw HUD (Controls)
        drawHUD(canvas)
    }

    private fun drawHUD(canvas: Canvas) {
        // Joystick Area (Right Bottom)
        paint.color = Color.DKGRAY
        paint.alpha = 100
        canvas.drawCircle(
            Constants.Control.JOYSTICK_CENTER_X,
            Constants.Control.JOYSTICK_CENTER_Y,
            Constants.Control.JOYSTICK_RADIUS,
            paint
        )

        if (gameEngine.inputManager.joystickActive) {
            paint.color = Color.LTGRAY
            val (dx, dy) = gameEngine.inputManager.getMoveVector()
            // Stick position visualization
            canvas.drawCircle(
                Constants.Control.JOYSTICK_CENTER_X + dx * 50,
                Constants.Control.JOYSTICK_CENTER_Y + dy * 50,
                50f,
                paint
            )
        }

        // Attack Button (Left Bottom)
        paint.color = if(gameEngine.inputManager.isAttackPressed) Color.MAGENTA else Color.RED
        paint.alpha = 150
        canvas.drawCircle(
            Constants.Control.BTN_ATTACK_X,
            Constants.Control.BTN_ATTACK_Y,
            Constants.Control.BTN_RADIUS,
            paint
        )
        paint.color = Color.WHITE
        paint.textSize = 40f
        canvas.drawText("ATTACK", Constants.Control.BTN_ATTACK_X - 60, Constants.Control.BTN_ATTACK_Y, paint)

        // Score
        paint.color = Color.WHITE
        paint.textSize = 60f
        canvas.drawText("SCORE: ${gameEngine.score}", 50f, 100f, paint)

        // Level
        canvas.drawText("LEVEL: ${gameEngine.waveManager.currentLevel}", 50f, 180f, paint)
    }

    override fun onGameOver() {
        // Handle Game Over
    }

    override fun onScoreUpdate(score: Int) {
        // Effect
    }
}
