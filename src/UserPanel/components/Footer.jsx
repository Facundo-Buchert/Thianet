import React from 'react'

export const Footer = () => {
  return (
    <footer
            class="w-full bg-white dark:bg-card-dark border-t border-gray-200 dark:border-gray-800 py-12 px-4 md:px-10 mt-12">
            <div class="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div class="flex flex-col gap-4">
                    <div class="flex items-center gap-2 text-primary">
                        <span class="material-symbols-outlined text-3xl">checkroom</span>
                        <span class="text-xl font-bold text-text-main-light dark:text-text-main-dark">THIANET</span>
                    </div>
                    <p class="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        Las mejores camisetas importadas! Sumá puntos con tus compras!.
                    </p>
                </div>
                <div>
                    <h4 class="font-bold text-text-main-light dark:text-text-main-dark mb-4">Shop</h4>
                    <ul class="flex flex-col gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <li><a class="hover:text-primary" href="#">Catálogo</a></li>
                        <li><a class="hover:text-primary" href="#">Preguntas Frecuentes</a></li>
                        <li><a class="hover:text-primary" href="#">Términos y condiciones</a></li>
                        <li><a class="hover:text-primary" href="#">Instagram</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold text-text-main-light dark:text-text-main-dark mb-4">Ayuda</h4>
                    <ul class="flex flex-col gap-2 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                        <li><a class="hover:text-primary" href="#">Guía de talles</a></li>
                        <li><a class="hover:text-primary" href="#">Política de cambios</a></li>
                        <li><a class="hover:text-primary" href="#">Contactanos</a></li>
                    </ul>
                </div>
                <div>
                    <h4 class="font-bold text-text-main-light dark:text-text-main-dark mb-4">Unite como reseller</h4>
                    <p class="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                        Queres revender, dejanos tu email y te contamos cómo!
                    </p>
                    <div class="flex gap-2">
                        <input
                            class="flex-1 h-10 rounded px-3 border border-gray-300 dark:border-gray-700 bg-transparent text-sm"
                            placeholder="Tu email" type="email" />
                        <button class="h-10 px-4 rounded bg-primary text-white text-sm font-bold">Unite</button>
                    </div>
                </div>
            </div>
            <div
                class="max-w-[1280px] mx-auto mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
                © 2026 THIANET. All rights reserved. No online payment required for reservation.
            </div>
        </footer>
  )
}
