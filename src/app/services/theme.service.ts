import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {

  private _isDark =
    new BehaviorSubject<boolean>(
      localStorage.getItem('theme') === 'dark'
    );

  isDark$ = this._isDark.asObservable();

  get isDark(): boolean {
    return this._isDark.value;
  }

  toggle(): void {
    const next = !this._isDark.value;
    this._isDark.next(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  setDark(value: boolean): void {
    this._isDark.next(value);
    localStorage.setItem('theme', value ? 'dark' : 'light');
  }
}