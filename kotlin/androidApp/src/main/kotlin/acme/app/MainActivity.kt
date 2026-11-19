package acme.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // The app draws behind the system bars and keeps its own content clear of them.
        enableEdgeToEdge()
        setContent {
            App(
                startInDesign = intent.hasExtra("section"),
                section = intent.getStringExtra("section"),
                glass = intent.getStringExtra("glass"),
                autoscroll = intent.getBooleanExtra("autoscroll", false),
                sheet = intent.getBooleanExtra("sheet", false),
            )
        }
    }
}
