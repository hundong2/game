package com.game.zombieshooter

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.game.zombieshooter.view.GameView
import android.view.Window
import android.view.WindowManager

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Fullscreen
        requestWindowFeature(Window.FEATURE_NO_TITLE)
        window.setFlags(
            WindowManager.LayoutParams.FLAG_FULLSCREEN,
            WindowManager.LayoutParams.FLAG_FULLSCREEN
        )

        // Set GameView as content
        // TODO: Implement Character Selection Screen (Phase 4)
        // Currently defaulted to Yi Sun-sin inside GameView
        setContentView(GameView(this))
    }
}
