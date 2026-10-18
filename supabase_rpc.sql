-- Create an RPC to fetch anonymous orders safely
CREATE OR REPLACE FUNCTION get_anon_orders(order_ids UUID[])
RETURNS SETOF public.orders AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.orders
  WHERE id = ANY(order_ids) AND user_id LIKE 'anon-%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
