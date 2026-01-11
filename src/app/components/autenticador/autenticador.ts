import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatIcon } from '@angular/material/icon';
import { Router } from '@angular/router';
import { JwtRequestDTO } from '../../models/jwtRequestDTO';
import { LoginService } from '../../services/login-service';

@Component({
  selector: 'app-autenticador',
  standalone: true,
  imports: [
    MatFormFieldModule,
    FormsModule,
    MatInputModule,
    MatButtonModule,
    MatIcon
  ],
  templateUrl: './autenticador.html',
  styleUrl: './autenticador.css',
})
export class Autenticador implements OnInit {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;

  constructor(
    private loginService: LoginService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // ⭐ NO limpiar sessionStorage aquí
    // Si ya está autenticado, redirigir
    if (this.loginService.verificar()) {
      this.router.navigate(['/inicio']);
    }
  }

  login() {
    if (!this.username || !this.password) {
      this.snackBar.open('Por favor ingresa usuario y contraseña', 'Cerrar', {
        duration: 3000
      });
      return;
    }

    this.isLoading = true;

    const request = new JwtRequestDTO();
    request.username = this.username;
    request.password = this.password;

    this.loginService.login(request).subscribe({
      next: () => {
        this.snackBar.open('¡Bienvenido!', 'Cerrar', {
          duration: 2000
        });
        this.router.navigate(['/inicio']);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.snackBar.open('Credenciales incorrectas', 'Cerrar', {
          duration: 3000
        });
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }
}