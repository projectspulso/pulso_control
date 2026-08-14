import { redirect } from 'next/navigation'

/**
 * O Decisor virou a HOME em 14/08/2026 (fusão com o antigo Dashboard). Esta rota continua de pé
 * como redirecionamento porque `/decisor` está espalhado em links antigos, na documentação e na
 * memória do agente — quebrar tudo isso para economizar um arquivo seria trocar caro por barato.
 */
export default function DecisorRedirect() {
  redirect('/')
}
