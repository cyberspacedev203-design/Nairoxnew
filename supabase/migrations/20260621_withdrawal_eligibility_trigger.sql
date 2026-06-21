-- Migration: Trigger to enqueue withdrawal eligibility email when balance reaches ₦200,000

-- Safety: ensure email_notifications exists

CREATE OR REPLACE FUNCTION public.notify_withdrawal_eligibility()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only act when profile reaches threshold and email verified and not already sent
  IF (TG_OP = 'INSERT') THEN
    IF (NEW.balance >= 200000 AND COALESCE(NEW.email_verified, false) = true AND COALESCE(NEW.withdrawal_email_sent, false) = false) THEN
      INSERT INTO public.email_notifications (user_id, type, payload) VALUES (NEW.id, 'withdrawal_eligibility', jsonb_build_object('email', NEW.email, 'balance', NEW.balance));
      UPDATE public.profiles SET withdrawal_email_sent = true WHERE id = NEW.id;
    END IF;
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (
      (OLD.balance < 200000 AND NEW.balance >= 200000)
      OR (COALESCE(OLD.email_verified, false) = false AND COALESCE(NEW.email_verified, false) = true AND NEW.balance >= 200000)
    ) AND COALESCE(NEW.withdrawal_email_sent, false) = false THEN
      INSERT INTO public.email_notifications (user_id, type, payload) VALUES (NEW.id, 'withdrawal_eligibility', jsonb_build_object('email', NEW.email, 'balance', NEW.balance));
      UPDATE public.profiles SET withdrawal_email_sent = true WHERE id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger on profiles for inserts and updates of balance or email_verified
DROP TRIGGER IF EXISTS trg_notify_withdrawal_eligibility ON public.profiles;
CREATE TRIGGER trg_notify_withdrawal_eligibility
AFTER INSERT OR UPDATE OF balance, email_verified
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_withdrawal_eligibility();
